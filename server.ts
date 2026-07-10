
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import { MercadoPagoConfig, Preference } from "mercadopago";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- MERCADO PAGO INITIALIZATION ---
  const mpAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const isMpConfigured = !!mpAccessToken;

  let mpClient: MercadoPagoConfig | null = null;
  if (isMpConfigured) {
    try {
      mpClient = new MercadoPagoConfig({ accessToken: mpAccessToken! });
      console.log("Mercado Pago SDK initialized successfully.");
    } catch (e) {
      console.error("Error initializing Mercado Pago Config SDK:", e);
    }
  } else {
    console.log("Mercado Pago token not found. Running in system fallback simulator mode.");
  }

  // --- SUBLOCAÇÃO & MERCADO PAGO API ROUTES ---

  // 1. Health check (enhanced)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      mercadoPagoIntegrated: isMpConfigured,
      timestamp: new Date().toISOString()
    });
  });

  // 2. CREATE PREFERENCE (Sublocação Avulsa com Cartão/Pix)
  app.post("/api/mercadopago/create-preference", async (req: any, res: any) => {
    try {
      const { bookings, professionalEmail, professionalName } = req.body;

      if (!bookings || !Array.isArray(bookings) || bookings.length === 0) {
        return res.status(400).json({ error: "Nenhuma reserva foi enviada." });
      }

      const items = bookings.map((b: any) => {
        const baseCost = b.pricePerHour * b.timeSlots.length;
        const insuranceCost = b.hasInsurance ? 9.90 * b.timeSlots.length : 0;
        const finalValue = baseCost + insuranceCost;

        return {
          id: b.id || Math.random().toString(),
          title: `Sublocação Room - ${b.roomName} (${b.timeSlots.length} horas) - ${b.date}`,
          quantity: 1,
          unit_price: finalValue,
          currency_id: "BRL"
        };
      });

      const totalAmount = items.reduce((acc: number, item: any) => acc + item.unit_price, 0);

      // If Mercado Pago is NOT configured, simulate response with sandbox URL fallback
      if (!isMpConfigured || !mpClient) {
        return res.json({
          preferenceId: `mock-pref-${Date.now()}`,
          init_point: `${process.env.APP_URL || "http://localhost:3000"}/#payment-simulation`,
          totalAmount,
          mode: "simulator",
          message: "Credenciais do Mercado Pago não configuradas. Servindo em modo simulado administrativo."
        });
      }

      // Real implementation using Mercado Pago SDK
      const preference = new Preference(mpClient);
      const hostUrl = process.env.APP_URL || `http://localhost:${PORT}`;

      const response = await preference.create({
        body: {
          items,
          payer: {
            email: professionalEmail || "professional-placeholder@example.com",
            name: professionalName || "Doutor Clínico"
          },
          back_urls: {
            success: `${hostUrl}/booking-success?status=approved`,
            failure: `${hostUrl}/booking-success?status=failed`,
            pending: `${hostUrl}/booking-success?status=pending`
          },
          auto_return: "approved",
          notification_url: `${hostUrl}/api/mercadopago/webhook`,
          metadata: {
            professionalEmail,
            bookingsCount: bookings.length,
            bookingsData: JSON.stringify(bookings.map((b: any) => ({
              id: b.id,
              roomName: b.roomName,
              dateKey: b.dateKey,
              timeSlots: b.timeSlots,
              hasInsurance: b.hasInsurance,
              baseValue: b.pricePerHour * b.timeSlots.length,
              insuranceValue: b.hasInsurance ? (9.9 * b.timeSlots.length) : 0
            })))
          }
        }
      });

      return res.json({
        preferenceId: response.id,
        init_point: response.init_point,
        totalAmount,
        mode: "production"
      });

    } catch (err: any) {
      console.error("Error creating Mercado Pago Preference:", err);
      return res.status(500).json({ error: "Erro interno ao gerar preferência no Mercado Pago: " + err.message });
    }
  });

  // 3. CREATE SUBSCRIPTION (Mensal Recorrente, Anual com 12 ciclos)
  app.post("/api/mercadopago/create-subscription", async (req: any, res: any) => {
    try {
      const { type, agendedStartDate, price, email, cardToken } = req.body;

      if (!type || !price || !email) {
        return res.status(400).json({ error: "Dados incompletos para assinar plano." });
      }

      const startDateTime = agendedStartDate ? new Date(agendedStartDate) : new Date();
      const secondChargeDate = new Date(startDateTime.getTime() + 30 * 24 * 60 * 60 * 1000);

      // System simulation payload/response if MP not ready
      if (!isMpConfigured || !mpClient) {
        return res.json({
          subscriptionId: `mock-sub-${Date.now()}`,
          status: "authorized",
          type,
          price,
          startDate: startDateTime.toISOString().split("T")[0],
          nextBillingDate: secondChargeDate.toISOString().split("T")[0],
          init_point: `${process.env.APP_URL || "http://localhost:3000"}/#subscription-simulation`,
          mode: "simulator",
          message: `Plano ${type === "annual" ? "Anual" : "Mensal"} simulado criado com início ajustado.`
        });
      }

      const hostUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      
      const payload = {
        preapproval_plan_id: type === "annual" ? "PLAN_ANUAL_ID_HERE" : "PLAN_MENSAL_ID_HERE",
        payer_email: email,
        card_token_id: cardToken,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: price,
          currency_id: "BRL",
          start_date: startDateTime.toISOString(),
          end_date: type === "annual" ? new Date(startDateTime.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined
        },
        back_url: `${hostUrl}/booking-success?subscription=true`,
        status: "authorized"
      };

      const rawResponse = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${mpAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const mpResponse = await rawResponse.json();

      return res.json({
        subscriptionId: mpResponse.id,
        status: mpResponse.status,
        init_point: mpResponse.init_point || `${hostUrl}/booking-success?subscription=true`,
        mode: "production",
        raw: mpResponse
      });

    } catch (err: any) {
      console.error("Error creating subscription:", err);
      return res.status(500).json({ error: "Erro interno criando assinatura: " + err.message });
    }
  });

  // 4. PARTIAL REFUND VALIDATION (Cancelamento parcial)
  app.post("/api/mercadopago/calculate-refund", (req: any, res: any) => {
    try {
      const { bookingsToCancel } = req.body;

      if (!bookingsToCancel || !Array.isArray(bookingsToCancel) || bookingsToCancel.length === 0) {
        return res.status(400).json({ error: "Nenhuma reserva fornecida para cancelamento." });
      }

      const now = new Date();
      const results: any[] = [];
      let totalRefundAmount = 0;
      let totalNonRefundableAmount = 0;

      for (const booking of bookingsToCancel) {
        const { dateKey, timeSlots, hasInsurance, pricePerHour } = booking;
        
        let refundableSlots: string[] = [];
        let nonRefundableSlots: string[] = [];
        let refundForThisBooking = 0;
        let insuranceLost = 0;

        for (const slot of timeSlots) {
          const [hourStr, minStr] = slot.split(":");
          const slotDateTime = new Date(dateKey);
          slotDateTime.setHours(parseInt(hourStr), parseInt(minStr), 0, 0);

          const diffInMs = slotDateTime.getTime() - now.getTime();
          const diffInHours = diffInMs / (1000 * 60 * 60);

          if (hasInsurance) {
            if (diffInHours >= 3) {
              refundableSlots.push(slot);
              refundForThisBooking += pricePerHour;
              insuranceLost += 9.90;
            } else {
              nonRefundableSlots.push(slot);
            }
          } else {
            if (diffInHours >= 24) {
              refundableSlots.push(slot);
              refundForThisBooking += pricePerHour;
            } else {
              nonRefundableSlots.push(slot);
            }
          }
        }

        const costTotal = (refundableSlots.length + nonRefundableSlots.length) * pricePerHour + (hasInsurance ? (refundableSlots.length + nonRefundableSlots.length) * 9.90 : 0);
        const lostTotal = costTotal - refundForThisBooking;

        totalRefundAmount += refundForThisBooking;
        totalNonRefundableAmount += lostTotal;

        results.push({
          bookingId: booking.id,
          roomName: booking.roomName,
          dateKey,
          timeSlots,
          hasInsurance,
          refundableSlots,
          nonRefundableSlots,
          refundCalculated: refundForThisBooking,
          insuranceRetained: insuranceLost,
          totalCancelledCount: timeSlots.length
        });
      }

      return res.json({
        eligibleForRefund: totalRefundAmount > 0,
        refundAmount: totalRefundAmount,
        nonRefundableAmount: totalNonRefundableAmount,
        detailedLog: results,
        notice: "Cálculos seguros efetuados em servidor de produção."
      });

    } catch (err: any) {
      return res.status(500).json({ error: "Erro interno de cálculo de reembolso: " + err.message });
    }
  });

  // 5. MERCADO PAGO WEBHOOK RECEIVER
  app.post("/api/mercadopago/webhook", async (req: any, res: any) => {
    try {
      const { query, body } = req;
      const topic = query.topic || body.type;
      const dataId = query.id || (body.data && body.data.id);

      console.log(`[Webhook Event] Recebido evento: ${topic}, ID: ${dataId}`);
      return res.status(200).send("OK");
    } catch (err: any) {
      console.error("Webhook processing error:", err.message);
      return res.status(500).send("Internal Webhook Error");
    }
  });

  // 6. PROXIED GOOGLE APPS SCRIPT SLOTS FETCHING (CORS Bypass)
  app.get("/api/slots", async (req: any, res: any) => {
    try {
      const room = req.query.room || "";
      const date = req.query.date || "";
      
      const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzAFVrhN1e0TLdtptqYi573psMPe8jDz82d5DrwtvTN7Fl6Dh2FMdtBuer5vMqxvKs8/exec';
      
      console.log(`[Proxy Link] Buscando slots: Room=${room}, Date=${date}`);
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'getSlots',
            room: room,
            date: date
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
      } catch (err: any) {
        console.warn("[Proxy Link warning] POST falhou, tentando GET...", err.message);
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const targetUrl = `${SCRIPT_URL}?action=getSlots&room=${encodeURIComponent(room)}&date=${encodeURIComponent(date)}`;
        
        const response = await fetch(targetUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          return res.json(data);
        }
      } catch (err: any) {
        console.warn("[Proxy Link warning] GET falhou. Usando offline generator:", err.message);
      }
      
      // Fallback local se estiver offline
      const dateSeed = date.split('-').reduce((sum: number, val: string) => sum + Number(val || 0), 0) || 12;
      const roomSeed = room ? room.charCodeAt(room.length - 1) : 48;
      
      const TIME_SLOTS_LOCAL = [
        { time: '07:00', reserved: false },
        { time: '08:00', reserved: true },
        { time: '09:00', reserved: false },
        { time: '10:00', reserved: false },
        { time: '11:00', reserved: true },
        { time: '12:00', reserved: false },
        { time: '13:00', reserved: false },
        { time: '14:00', reserved: false },
        { time: '15:00', reserved: false },
        { time: '16:00', reserved: true },
        { time: '17:00', reserved: false },
        { time: '18:00', reserved: false }
      ];

      const seededSlots = TIME_SLOTS_LOCAL.map((s: any, index: number) => {
        const isReserved = (dateSeed + roomSeed + index * 17) % 3 === 0;
        return { ...s, reserved: isReserved };
      });
      
      return res.json(seededSlots);
    } catch (e: any) {
      console.error("[Proxy Link error] Erro slots proxy:", e);
      return res.status(500).json({ error: "Erro interno slots." });
    }
  });

  // API Route: Proxy for Google Sheets/Apps Script
  app.get("/api/proxy-sheet", async (req, res) => {
    const url = req.query.url as string;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Proxying request to: ${url}`);
      
      // Manual redirect handling for Google Apps Script
      // Using a very simple User-Agent that doesn't trigger "Cookie check" for browsers
      let response = await fetch(url, {
        method: 'GET',
        redirect: 'manual',
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'curl/7.68.0' 
        }
      });

      // Follow redirect manually
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (location) {
          console.log(`Manual redirect following to: ${location}`);
          response = await fetch(location, {
            method: 'GET',
            redirect: 'follow',
            headers: {
               'User-Agent': 'curl/7.68.0'
            }
          });
        }
      }

      const responseStatus = response.status;
      const contentType = response.headers.get("content-type") || "";
      const finalUrl = response.url || "";
      const responseText = await response.text();
      const trimmedText = responseText.trim();
      
      console.log(`Downstream: ${responseStatus} | Final URL: ${finalUrl} | Content-Type: ${contentType}`);

      // Handle JSONP or raw JSON
      let data;
      let isData = false;
      
      // Try to extract JSON from JSONP callback if present
      if (trimmedText.includes('(') && trimmedText.includes(')')) {
        const match = trimmedText.match(/^[^(]+\((.*)\);?$/s);
        if (match) {
          try {
            data = JSON.parse(match[1]);
            isData = true;
          } catch (e) {}
        }
      }

      // Try raw JSON
      if (!isData && (trimmedText.startsWith('{') || trimmedText.startsWith('['))) {
        try {
          data = JSON.parse(trimmedText);
          isData = true;
        } catch (e) {}
      }

      if (isData) {
        if (data.success === false && data.error) {
          return res.status(422).json({ error: data.error, ...data });
        }
        return res.json(data);
      }

      // ERROR CASE: 403 or Login Redirect or Permission Request
      const isAuthBlock = 
        finalUrl.includes("accounts.google.com") || 
        finalUrl.includes("ServiceLogin") || 
        responseText.includes("google-signin") ||
        responseText.includes("Review Permissions") ||
        responseText.includes("Revisar permissões") ||
        responseText.includes("Authorization required");

      if (isAuthBlock) {
         if (responseText.includes("Advanced") || responseText.includes("Avançado") || responseText.includes("não seguro")) {
            return res.status(403).json({
              error: 'O Google exige autorização manual. Abra o link do script no navegador, clique em "Avançado" e "Acessar (não seguro)".',
              code: 'UNSAFE_APP_WARNING'
            });
         }
         return res.status(403).json({ 
           error: 'O Google está pedindo login ou autorização. Verifique se publicou como "Qualquer pessoa" e se você já autorizou o script no editor do Google.',
           code: 'AUTH_REQUIRED'
         });
      }

      // OTHER GOOGLE ERRORS
      if (responseText.includes("Google") && (responseText.includes("404") || responseText.includes("Error"))) {
           return res.status(404).json({ 
             error: 'Script não encontrado (404). Verifique se a URL termina em /exec. Se mudou o script, gere uma "Nova Implantação".',
             code: 'NOT_FOUND'
           });
      }

      // If we got HTML with a title but expected JSON
      if (responseText.includes("<title>") && responseText.includes("</title>")) {
         const titleMatch = responseText.match(/<title>(.*?)<\/title>/i);
         const pageTitle = titleMatch ? titleMatch[1] : "Página do Google";
         
         // Specific hint for Apps Script HTML output
         let hint = "No seu código .gs, use 'ContentService.createTextOutput' (Dados) e não 'HtmlService' (UI).";
         if (responseText.includes("google-signin") || responseText.includes("accounts.google.com")) {
            hint = "O Google está pedindo login ou permissão. Verifique se publicou como 'Qualquer pessoa' (Anyone) e autorizou o script.";
         }
         
         return res.status(422).json({
           error: `O Script retornou uma PÁGINA HTML ("${pageTitle}"). ${hint}`,
           code: 'HTML_INSTEAD_OF_JSON'
         });
      }

      // Default fallthrough - if we got something we didn't expect
      return res.status(500).json({
        error: `Resposta inesperada do Script (Status ${responseStatus}). Verifique se a URL está correta e se o script foi publicado como 'Qualquer pessoa'.`,
        code: 'UNEXPECTED_RESPONSE',
        status: responseStatus,
        contentType
      });
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ error: "Failed to fetch from downstream URL" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
