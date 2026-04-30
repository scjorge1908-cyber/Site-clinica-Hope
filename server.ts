
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
      
      // Basic URL validation
      if (url.includes("docs.google.com/spreadsheets") || url.includes("/edit") || url.includes("/view")) {
         return res.status(400).json({ 
           error: 'URL Inválida: Link da Planilha colado. Use o link do "App da Web" (/exec).',
           code: 'INVALID_URL_TYPE'
         });
      }

      if (url.endsWith('/dev')) {
         return res.status(400).json({ 
           error: 'URL de Rascunho detectada: Use "Nova Implantação" para produzir a URL /exec.',
           code: 'DEV_URL_NOT_ALLOWED'
         });
      }

      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json, text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const responseStatus = response.status;
      const contentType = response.headers.get("content-type") || "";
      const finalUrl = response.url || "";
      const responseText = await response.text();
      const trimmedText = responseText.trim();
      
      console.log(`Downstream: ${responseStatus} | Final URL: ${finalUrl} | Content-Type: ${contentType}`);

      // SUCCESS CASE: JSON returned (handled very permissively)
      const isLikelyJson = contentType.includes("application/json") || 
                           trimmedText.startsWith('{') || 
                           trimmedText.startsWith('[');

      if (isLikelyJson) {
        try {
          const data = JSON.parse(trimmedText);
          // If the script returned an error object but 200 OK
          if (data.success === false && data.error) {
              return res.status(422).json({ error: data.error, ...data });
          }
          return res.json(data);
        } catch (e) {
          console.warn("Failed to parse JSON even though it looked like it", e);
        }
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
