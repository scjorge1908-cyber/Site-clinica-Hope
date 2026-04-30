
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
