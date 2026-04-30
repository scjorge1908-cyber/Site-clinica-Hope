
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
      
      console.log(`Downstream: ${responseStatus} | Final URL: ${finalUrl} | Content-Type: ${contentType}`);

      // SUCCESS CASE: JSON returned
      if (contentType.includes("application/json") || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        try {
          const data = JSON.parse(responseText);
          if (!response.ok) {
             return res.status(responseStatus).json({
               error: data.error || `Erro do Script: ${responseStatus}`,
               ...data
             });
          }
          return res.json(data);
        } catch (e) {
          // Fall through if not really JSON
        }
      }

      // ERROR CASE: 403 or Login Redirect
      if (finalUrl.includes("accounts.google.com") || finalUrl.includes("ServiceLogin") || responseStatus === 401 || responseStatus === 403) {
         if (responseText.includes("Advanced") || responseText.includes("Avançado") || responseText.includes("não seguro") || responseText.includes("unsafe")) {
            return res.status(403).json({
              error: 'Ação Necessária: O script exige autorização manual. Abra a URL do script no seu navegador, clique em "Avançado" e depois em "Acessar (não seguro)" para liberar o acesso.',
              code: 'UNSAFE_APP_WARNING'
            });
         }

         if (responseText.includes("not have access") || responseText.includes("não tem acesso") || responseText.includes("permissão") || responseText.includes("permission")) {
            return res.status(403).json({
              error: 'Acesso Negado (403): O Google indica falta de permissão. Certifique-se que em "Executar como" selecionou "Eu" (Me) e em "Quem pode acessar" selecionou "Qualquer pessoa" (Anyone).',
              code: 'NO_ACCESS'
            });
         }

         return res.status(403).json({ 
           error: 'Bloqueio do Google (403): O acesso externo foi recusado. Verifique se EXECUTAR COMO está selecionado "EU" (Me). Se já estiver, crie uma "NOVA Implantação" (Menu Implantar) e use a nova URL.',
           code: 'AUTH_REQUIRED',
           status: responseStatus
         });
      }

      // OTHER GOOGLE ERRORS
      if (responseText.includes("Google") && (responseText.includes("404") || responseText.includes("Error"))) {
           return res.status(404).json({ 
             error: 'Script não encontrado (404). Verifique se a URL termina em /exec. Se mudou o script, gere uma "Nova Implantação".',
             code: 'NOT_FOUND'
           });
      }

      const snippet = responseText.slice(0, 150).replace(/[<>]/g, '').trim();
      return res.status(422).json({ 
        error: `O Script não retornou um JSON válido (Recebido: "${snippet}..."). Verifique seu código .gs.`,
        code: 'INVALID_FORMAT'
      });
      }
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
