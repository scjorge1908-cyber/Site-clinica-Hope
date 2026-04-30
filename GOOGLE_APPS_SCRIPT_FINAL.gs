// =======================================================
// CLÍNICA HOPE — GOOGLE APPS SCRIPT API (VERSÃO FINAL)
// ✅ GARANTIDO: Retorna SEMPRE JSON puro, nunca HTML
// =======================================================

/**
 * FUNÇÃO PRINCIPAL: Trata TODOS os GET como JSON API
 * NÃO retorna nada senão JSON com ContentService
 */
function doGet(e) {
  // ✅ IMEDIATO: Força MIME type JSON
  try {
    // Busca dados da planilha
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName("Agenda");
    
    if (!aba) {
      return forcarJSON({ 
        success: false, 
        error: "Aba 'Agenda' não encontrada",
        dicas: [
          "1. Certifique-se que existe uma aba chamada 'Agenda'",
          "2. A aba deve ter dados na primeira linha como cabeçalho",
          "3. Salve a planilha com Ctrl+S"
        ]
      });
    }

    // Lê dados brutos
    const range = aba.getDataRange();
    const dados = range.getValues();
    const displayValues = range.getDisplayValues();
    const tz = Session.getScriptTimeZone();

    // Processa linhas
    const resultado = [];
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      const linhaDisplay = displayValues[i];
      
      if (!linha[2] || String(linha[2]).trim() === "") continue; // Pula se não há paciente

      resultado.push({
        dia: String(linha[0] || "").trim(),
        horario: String(linhaDisplay[1] || "").trim().substring(0, 5),
        paciente: String(linha[2] || "").trim(),
        telefone: String(linha[3] || "").trim(),
        plano: String(linha[4] || "").trim(),
        psicologa: String(linha[5] || "").trim(),
        carterinha: String(linha[6] || "").trim(),
        valor: linha[7] || 0,
        sala: String(linha[8] || "Sem Sala").trim(),
        dtNascimento: linha[12] instanceof Date 
          ? Utilities.formatDate(linha[12], tz, "dd/MM/yyyy") 
          : String(linha[12] || ""),
        dtInicio: linha[26] instanceof Date 
          ? Utilities.formatDate(linha[26], tz, "dd/MM/yyyy") 
          : String(linha[26] || "")
      });
    }

    // ✅ RETORNA JSON PURO
    return forcarJSON({
      success: true,
      data: resultado,
      total: resultado.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return forcarJSON({
      success: false,
      error: error.toString(),
      trace: error.stack || "Sem stack trace"
    });
  }
}

/**
 * FUNÇÃO DE SEGURANÇA: Força retorno JSON em QUALQUER situação
 * ✅ GARANTIA: Retorna ContentService.MimeType.JSON sempre
 */
function forcarJSON(obj) {
  // 1. Converte para string JSON
  const jsonStr = JSON.stringify(obj);
  
  // 2. Cria TextOutput com JSON puro
  const output = ContentService.createTextOutput(jsonStr);
  
  // 3. FORÇA MIME type JSON (não deixa negociar)
  output.setMimeType(ContentService.MimeType.JSON);
  
  // 4. Retorna
  return output;
}

/**
 * FUNÇÃO POST: Também retorna JSON
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    
    return forcarJSON({
      success: true,
      message: "POST recebido",
      payload: payload,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return forcarJSON({
      success: false,
      error: error.toString()
    });
  }
}

// =======================================================
// TESTES E AUTORIZAÇÃO
// =======================================================
function AUTORIZAR_TUDO() {
  // Força autorização de todos os serviços usados
  Session.getActiveUser().getEmail();
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder();
  SpreadsheetApp.getActiveSpreadsheet();
  Logger.log("✅ Autorização completa realizada");
}

function TESTAR_LOCALMENTE() {
  // Simula um GET request
  const resultado = doGet({});
  Logger.log("Resposta da função doGet:");
  Logger.log(resultado.getContent());
}
