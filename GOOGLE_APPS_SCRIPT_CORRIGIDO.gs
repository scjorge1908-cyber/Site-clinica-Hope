// =======================================================
// CLÍNICA HOPE — SISTEMA UNIFICADO (PWA v20 - COMPLETA)
// ✅ VERSÃO CORRIGIDA: doGet() e doPost() retornam JSON puro
// =======================================================

/**
 * BUSCA CONFIGURAÇÕES DA ABA "DadosPsi"
 * Coluna A: Nome da Psicóloga | Coluna G: E-mail Administrativo
 */
function getConfiguracoesIniciais() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaDados = ss.getSheetByName("DadosPsi");
    if (!abaDados) return { nome: "PSI Michelle", emailAdmin: "contato@clinicahopebrasil.com.br" };
    
    const dados = abaDados.getRange("A2:G2").getValues()[0];
    return {
      nome: dados[0] || "PSI Michelle",
      emailAdmin: dados[6] || "contato@clinicahopebrasil.com.br"
    };
  } catch (e) {
    Logger.log("⚠️ getConfiguracoesIniciais falhou: " + e.message);
    return { nome: "PSI Michelle", emailAdmin: "contato@clinicahopebrasil.com.br" };
  }
}

// Inicialização de constantes dinâmicas
const CONFIG = getConfiguracoesIniciais();
const NOME_PSICOLOGA = CONFIG.nome;
const EMAIL_ADMINISTRATIVO = CONFIG.emailAdmin;

const ABA_AGENDA = "Agenda";
const ABA_REGISTRO = "Atendimentos";
const ABA_NOTA = "Nota";
const ABA_CANCELADOS = "Cancelados";

// =======================================================
// 01. MÓDULO SETUP INICIAL & UI (POP-UP)
// =======================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu("Clínica Hope")
    .addItem("🏠 Abrir Sistema", "abrirAppUnificado")
    .addToUi();

  const status = verificarPendenciaFinanceira();
  
  if (status.codigo !== "OK") {
    let msg = "O sistema identificou pendências em: " + status.mesReferencia +
              "\nMotivo: " + status.codigo.replace("FALTA_", "FALTA ");
    
    if (status.prioridade === "ALTA") {
      msg = "⛔ BLOQUEIO: Pendência CRÍTICA de " + status.mesReferencia +
            ".\nMotivo: " + status.codigo.replace("FALTA_", "FALTA ") +
            "\n\nO prazo expirou há mais de 30 dias. Favor contatar o financeiro imediatamente.";
    } else if (status.codigo === "PENDENTE_TOTAL") {
      msg += "\n(Nota Fiscal e RPA)";
    }
    
    SpreadsheetApp.getUi().alert("⚠️ PENDÊNCIA FINANCEIRA", msg, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function verificarAlertasVisuais() {
  onOpen();
}

function abrirAppUnificado() {
  const html = HtmlService.createHtmlOutputFromFile("Index")
    .append('<script>window.__SHEETS_MODAL__=true;</script>')
    .setWidth(1300).setHeight(820);
  SpreadsheetApp.getUi().showModalDialog(html, "Sistema da Clínica Hope");
}

/**
 * Inclui arquivos HTML parciais (para PWA manifest, etc.)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// =======================================================
// 02. MÓDULO UTILITÁRIOS
// =======================================================
function salvarArquivoNoDrive(base64, mimeType, nome, pastaPrincipal) {
  if (!base64) throw new Error("Arquivo vazio - nada para salvar.");
  
  try {
    let folder;
    const folders = DriveApp.getFoldersByName(pastaPrincipal);
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(pastaPrincipal);
    
    const blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, nome);
    return folder.createFile(blob).getUrl();
  } catch (e) {
    throw new Error("Erro ao salvar no Drive: " + e.message);
  }
}

// =======================================================
// FUNÇÕES AUXILIARES UNIVERSAIS
// =======================================================

/**
 * Normaliza texto para busca (remove acentos, pontuação, espaços extras)
 */
function normalizarParaBusca(texto) {
  if (!texto || typeof texto !== 'string') return '';
  
  return texto
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Limpa carteirinha - mantém apenas números
 */
function limparCarteirinha(carteirinha) {
  if (!carteirinha || typeof carteirinha !== 'string') return '';
  const apenasNumeros = carteirinha.replace(/\D/g, '');
  return apenasNumeros === '' ? carteirinha.trim() : apenasNumeros;
}

/**
 * Converte valor em qualquer formato BR para número
 */
function converterValorParaNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (typeof valor !== 'string') return 0;
  
  const limpo = valor
    .replace(/R\$/gi, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')
    .trim();
  
  const numero = parseFloat(limpo);
  if (isNaN(numero)) {
    Logger.log("⚠️ Conversão falhou para: '" + valor + "'");
    return 0;
  }
  return numero;
}

// =======================================================
// 03. MÓDULO AGENDA - VERSÃO HÍBRIDA (MÚLTIPLAS SALAS)
// =======================================================
function getDadosDaAgenda() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName("Agenda");
    if (!aba) {
      Logger.log("❌ Aba 'Agenda' não encontrada");
      return [];
    }
    
    const range = aba.getDataRange();
    const dadosBrutos = range.getValues();
    const dadosTexto = range.getDisplayValues();
    const timezone = Session.getScriptTimeZone();
    const resultado = [];
    
    for (let i = 1; i < dadosBrutos.length; i++) {
      const linha = dadosBrutos[i];
      const linhaTexto = dadosTexto[i];
      
      if (!linha[2]) continue;

      // Data nascimento (Coluna 12)
      let nascimento = "";
      if (linha[12] instanceof Date) {
        nascimento = Utilities.formatDate(linha[12], timezone, "dd/MM/yyyy");
      } else {
        nascimento = String(linha[12] || "").trim();
      }

      // Data início atendimento (Coluna 26 / AA)
      let inicioAtendimento = "";
      if (linha[26] instanceof Date) {
        inicioAtendimento = Utilities.formatDate(linha[26], timezone, "dd/MM/yyyy");
      } else {
        inicioAtendimento = String(linha[26] || "").trim();
      }

      // Horário (Coluna 1)
      let horarioCorrigido = String(linhaTexto[1] || "").trim().substring(0, 5);

      // Sala (Coluna 8)
      let sala = String(linha[8] || "").trim();
      if (!sala) sala = "Sala Não Definida";

      resultado.push({
        dia: String(linha[0] || "").trim(),
        horario: horarioCorrigido,
        paciente: String(linha[2] || "").trim(),
        telefone: String(linha[3] || "").trim(),
        plano: String(linha[4] || "").trim(),
        psicologa: String(linha[5] || "").trim(),
        carterinha: String(linha[6] || "").trim(),
        valor: linha[7] || "",
        sala: sala,
        dtNascimento: nascimento,
        dtInicio: inicioAtendimento
      });
    }
    
    Logger.log("✅ Agenda: " + resultado.length + " registros processados");
    return resultado;
    
  } catch (erro) {
    Logger.log("🔥 ERRO getDadosDaAgenda: " + erro.toString());
    return [];
  }
}

// =======================================================
// 04. MÓDULO PACIENTES
// =======================================================
function getPacientes() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(ABA_AGENDA);
    if (!aba) return [];
    
    const dados = aba.getRange("C2:C").getValues().flat();
    return [...new Set(
      dados.map(x => String(x).trim()).filter(x => x && x !== "💚")
    )].sort();
  } catch (e) {
    Logger.log("Erro getPacientes: " + e.message);
    return [];
  }
}

// =======================================================
// 05. MÓDULO MOVER AGENDAMENTO
// =======================================================
function moverAgendamento(paciente, diaAtual, horaAtual, diaNovo, horaNova) {
  if (!paciente || !diaAtual || !horaAtual || !diaNovo || !horaNova) {
    throw new Error("Parâmetros incompletos para mover agendamento.");
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(ABA_AGENDA);
    const dados = aba.getDataRange().getValues();
    const tz = ss.getSpreadsheetTimeZone();
    
    let origem = -1, destino = -1;
    let blocoOriginal = [];
    
    const d1 = diaAtual.toLowerCase(), h1 = horaAtual.substring(0, 5);
    const d2 = diaNovo.toLowerCase(), h2 = horaNova.substring(0, 5);

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      const rDia = String(row[0]).toLowerCase();
      let rHora = row[1] instanceof Date
        ? Utilities.formatDate(row[1], tz, "HH:mm")
        : String(row[1]).substring(0, 5);
      
      if (rDia === d1 && rHora === h1 && String(row[2]).includes(paciente)) {
        origem = i + 1;
        blocoOriginal = aba.getRange(origem, 3, 1, 25).getValues()[0];
      }
      
      if (rDia === d2 && rHora === h2 && (String(row[2]) === "💚" || String(row[2]) === "")) {
        destino = i + 1;
      }
    }

    if (origem === -1) throw new Error("Origem não encontrada.");
    if (destino === -1) throw new Error("Destino não está livre.");

    // Protege F (6) e I (9) do destino
    const valorF_Destino = aba.getRange(destino, 6).getValue();
    const valorI_Destino = aba.getRange(destino, 9).getValue();

    // Move o bloco
    aba.getRange(destino, 3, 1, 25).setValues([blocoOriginal]);
    aba.getRange(destino, 6).setValue(valorF_Destino);
    aba.getRange(destino, 9).setValue(valorI_Destino);

    // Limpa origem (preserva F e I)
    aba.getRange(origem, 3).setValue("💚");
    aba.getRange(origem, 4, 1, 2).clearContent();
    aba.getRange(origem, 7, 1, 2).clearContent();
    aba.getRange(origem, 10, 1, 18).clearContent();

    return "✅ Movido com sucesso!";
  } catch (e) {
    throw new Error("Erro ao mover: " + e.message);
  }
}

// =======================================================
// 06. MÓDULO REGISTRAR SESSÃO (VALIDAÇÕES COMPLETAS)
// =======================================================
function salvarRegistroComAnexo(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName(ABA_REGISTRO);
    const abaAgenda = ss.getSheetByName(ABA_AGENDA);

    // ============ VALIDAÇÕES ============
    if (!dados.paciente || dados.paciente === "Selecione..." || dados.paciente.trim() === "") {
      throw new Error("🚫 Selecione um PACIENTE para salvar!");
    }

    if (!dados.quantidadeSessoes || dados.quantidadeSessoes <= 0) {
      throw new Error("🚫 A quantidade de sessões deve ser no mínimo 1!");
    }

    if (!dados.datas || dados.datas.length === 0) {
      throw new Error("🚫 Selecione pelo menos uma DATA!");
    }

    if (!dados.tipoAtendimento || dados.tipoAtendimento === "Selecione...") {
      throw new Error("🚫 Selecione um TIPO DE ATENDIMENTO!");
    }

    const isCancelamento = dados.tipoAtendimento === "Cancelar Guia / Não faturar";
    
    if (!isCancelamento) {
      if (!dados.numeroGuia || dados.numeroGuia.trim() === "" ||
          dados.numeroGuia === "Selecione..." ||
          dados.numeroGuia.includes("não Registrada")) {
        throw new Error("🚫 Selecione um NÚMERO DA GUIA válido!");
      }
      
      const guiaNumerica = dados.numeroGuia.replace(/\D/g, '');
      if (guiaNumerica.length < 3) {
        throw new Error("🚫 Número da guia parece inválido!");
      }
    }

    if (!isCancelamento && (!dados.anexoGuia || !dados.anexoGuia.base64)) {
      throw new Error("🚫 O anexo da Guia é OBRIGATÓRIO!");
    }

    // Valida domingos
    if (dados.datas && dados.datas.length > 0) {
      dados.datas.forEach(function(d) {
        if (d) {
          var partes = d.split("-");
          var dataCheck = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
          if (dataCheck.getDay() === 0) {
            throw new Error("🚫 A data " + partes[2] + "/" + partes[1] + " é DOMINGO!");
          }
        }
      });
    }

    // Cria aba se necessário
    if (!aba) {
      aba = ss.insertSheet(ABA_REGISTRO);
      aba.appendRow(["DataReg", "Profissional", "Paciente", "DataSessao", "Guia", "Qtd", "Tipo", "Links", "Obs", "", "", "Info Agenda (L)", "", "Valor (N)"]);
    }

    // Valida guia duplicada
    if (dados.numeroGuia && String(dados.numeroGuia).trim() !== "" && !isCancelamento) {
      var todos = aba.getDataRange().getValues();
      for (var i = 1; i < todos.length; i++) {
        if (String(todos[i][4]).trim() === String(dados.numeroGuia).trim()) {
          throw new Error("🚫 A Guia nº " + dados.numeroGuia + " já consta no sistema!");
        }
      }
    }

    // ============ ARQUIVOS ============
    var urlGuia = "";
    if (dados.anexoGuia) {
      urlGuia = salvarArquivoNoDrive(dados.anexoGuia.base64, dados.anexoGuia.mimeType,
        "Guia_" + dados.paciente + "_" + dados.numeroGuia, "Atestados_ClinicaHope/Guias");
    }
    
    var urlAtestado = "";
    if (dados.anexoAtestado) {
      urlAtestado = salvarArquivoNoDrive(dados.anexoAtestado.base64, dados.anexoAtestado.mimeType,
        "Atestado_" + dados.paciente, "Atestados_ClinicaHope/Atestados");
    }

    var links = urlGuia ? '=HYPERLINK("' + urlGuia + '"; "Guia ' + dados.numeroGuia + '")' : "-";
    if (urlAtestado) links += ' & CHAR(10) & =HYPERLINK("' + urlAtestado + '"; "📎 Ver Atestado")';

    // ============ DADOS DA AGENDA ============
    var dadosAgenda = abaAgenda.getDataRange().getValues();
    
    function buscarDadosAgenda(paciente) {
      var info = { dadoColunaG: "", valor: 0 };
      for (var j = 1; j < dadosAgenda.length; j++) {
        var row = dadosAgenda[j];
        if (String(row[2]).trim() === paciente) {
          info.dadoColunaG = row[6];
          info.valor = row[7];
        }
      }
      return info;
    }

    // ============ GRAVAÇÃO ============
    var dataHojeLimpa = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");

    if (isCancelamento) {
      var infoExtra = buscarDadosAgenda(dados.paciente);
      aba.appendRow([
        dataHojeLimpa, NOME_PSICOLOGA, dados.paciente, dataHojeLimpa,
        dados.numeroGuia || "", 0, dados.tipoAtendimento, links,
        dados.observacao, "", "", infoExtra.dadoColunaG, "", infoExtra.valor
      ]);
    } else {
      dados.datas.forEach(function(d) {
        if (!d) return;
        var p = d.split("-");
        var dataFormatada = p[2] + "/" + p[1] + "/" + p[0];
        var infoExtra = buscarDadosAgenda(dados.paciente);
        aba.appendRow([
          dataHojeLimpa, NOME_PSICOLOGA, dados.paciente, dataFormatada,
          dados.numeroGuia, dados.quantidadeSessoes, dados.tipoAtendimento,
          links, dados.observacao, "", "", infoExtra.dadoColunaG, "", infoExtra.valor
        ]);
      });
    }
    
    return "✅ Registro salvo com sucesso!";
    
  } catch (e) {
    throw new Error(e.message);
  }
}

// =======================================================
// 07. MÓDULO DAR ALTA
// =======================================================
function darAltaPaciente(nome, motivo) {
  if (!nome || nome === "Selecione...") throw new Error("Selecione um paciente.");
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAgenda = ss.getSheetByName(ABA_AGENDA);
    let abaCancelados = ss.getSheetByName(ABA_CANCELADOS);

    if (!abaCancelados) {
      abaCancelados = ss.insertSheet(ABA_CANCELADOS);
      abaCancelados.appendRow([
        "Data Cancelamento", "Dia da Semana", "Horário", "Paciente", "Telefone",
        "Plano", "Psicóloga", "Carterinha", "Valor", "SALA", "Email", "CPF",
        "Plano Saúde", "Data Nascimento", "Sexo", "Cidade", "Bairro",
        "Nome Médico", "CRM", "CID", "Telefone Emergência", "Responsável",
        "CPF Responsável", "Anexo Carterinha", "Anexo Guia", "Data Cadastro", "Observações"
      ]);
    }

    const dados = abaAgenda.getDataRange().getValues();
    const tz = ss.getSpreadsheetTimeZone();
    let encontrou = false;

    for (let i = 1; i < dados.length; i++) {
      if (String(dados[i][2]).trim() === nome) {
        encontrou = true;
        let linhaAgenda = dados[i];
        let horaFormatada = linhaAgenda[1] instanceof Date
          ? Utilities.formatDate(linhaAgenda[1], tz, "HH:mm")
          : String(linhaAgenda[1]);

        MailApp.sendEmail({
          to: EMAIL_ADMINISTRATIVO,
          subject: "🚪 ALTA DE PACIENTE - " + nome,
          htmlBody: "Olá, Administrativo.<br><br>Foi realizada a ALTA do paciente:<br><br>" +
            "👤 <b>Paciente:</b> " + nome + "<br>" +
            "📝 <b>Motivo:</b> " + motivo + "<br>" +
            "👩‍⚕️ <b>Psicóloga:</b> " + linhaAgenda[5] + " (" + NOME_PSICOLOGA + ")<br>" +
            "📅 <b>Horário Liberado:</b> " + linhaAgenda[0] + " às " + horaFormatada + "<br>" +
            "🏥 <b>Plano:</b> " + linhaAgenda[4]
        });

        let linhaParaColar = [new Date()].concat(linhaAgenda);
        let indexObs = linhaParaColar.length - 1;
        if (indexObs >= 0) {
          linhaParaColar[indexObs] = "[MOTIVO: " + motivo + "] " + linhaParaColar[indexObs];
        }

        abaCancelados.appendRow(linhaParaColar);
        const linha = i + 1;
        abaAgenda.getRange(linha, 3).setValue("💚");
        abaAgenda.getRange(linha, 4, 1, 2).clearContent();
        abaAgenda.getRange(linha, 7, 1, 2).clearContent();
        abaAgenda.getRange(linha, 10, 1, 20).clearContent();
      }
    }
    return encontrou ? "✅ Alta realizada e e-mail enviado." : "⚠️ Paciente não encontrado.";
  } catch (e) {
    throw new Error(e.message);
  }
}

// =======================================================
// 08. MÓDULO FINANCEIRO
// =======================================================
function salvarFinanceiro(dados) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let aba = ss.getSheetByName(ABA_NOTA);
    if (!aba) {
      aba = ss.insertSheet(ABA_NOTA);
      aba.appendRow(["Data", "Link Nota", "Link RPA", "Mês", "Ano", "Valor", "Arquivo"]);
    }

    const nomeArq = NOME_PSICOLOGA.replace(/ /g, "_") + "_" +
      (dados.tipo === 'nota' ? "NOTA" : "RPA") + "_" + dados.mes + "_" + dados.ano;
    
    const blob = Utilities.newBlob(Utilities.base64Decode(dados.arquivoBase64), dados.mimeType, nomeArq);
    
    let folder;
    const folders = DriveApp.getFoldersByName("Financeiro_ClinicaHope");
    folder = folders.hasNext() ? folders.next() : DriveApp.createFolder("Financeiro_ClinicaHope");
    
    const arquivoSalvo = folder.createFile(blob);
    const url = arquivoSalvo.getUrl();

    const hoje = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm");
    const colNota = dados.tipo === 'nota' ? url : "";
    const colRpa = dados.tipo === 'rpa' ? url : "";

    aba.appendRow([hoje, colNota, colRpa, dados.mes, dados.ano, dados.valor, nomeArq]);

    MailApp.sendEmail({
      to: EMAIL_ADMINISTRATIVO,
      subject: "📄 Novo Financeiro (" + dados.tipo.toUpperCase() + ") - " + NOME_PSICOLOGA,
      htmlBody: "Nova documentação enviada:<br>" +
        "👤 <b>Profissional:</b> " + NOME_PSICOLOGA + "<br>" +
        "📅 <b>Referência:</b> " + dados.mes + " / " + dados.ano + "<br>" +
        "💰 <b>Valor:</b> R$ " + dados.valor + "<br>" +
        "🔗 <b>Link:</b> " + url,
      attachments: [blob]
    });

    return { success: true, msg: "✅ Processo concluído!" };
  } catch (e) {
    return { success: false, msg: "Erro: " + e.message };
  }
}

function getHistoricoFinanceiro() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(ABA_NOTA);
    if (!aba) return [];
    
    const lastRow = aba.getLastRow();
    if (lastRow < 2) return [];
    
    const numRegistros = 15;
    const startRow = Math.max(2, lastRow - numRegistros + 1);
    const numRows = lastRow - startRow + 1;
    
    const dados = aba.getRange(startRow, 1, numRows, 6).getValues();
    const tz = ss.getSpreadsheetTimeZone();

    return dados.reverse().map(function(linha) {
      let dataFmt = "";
      if (linha[0] instanceof Date) {
        dataFmt = Utilities.formatDate(linha[0], tz, "dd/MM/yyyy HH:mm");
      } else {
        dataFmt = String(linha[0]);
      }
      return {
        data: dataFmt,
        linkNota: linha[1],
        linkRpa: linha[2],
        tipo: linha[1] ? "Nota Fiscal" : "RPA",
        mes: linha[3],
        ano: linha[4],
        valor: linha[5]
      };
    });
  } catch (e) {
    Logger.log("Erro historico: " + e.message);
    return [];
  }
}

// =======================================================
// 09. MÓDULO RELATÓRIO PDF (PRODUÇÃO)
// =======================================================
function gerarRelatorioFinanceiroPDF(mesNome, anoInput) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtend = ss.getSheetByName(ABA_REGISTRO);
    if (!abaAtend) throw new Error("Aba de Atendimentos não encontrada.");
    
    const dados = abaAtend.getDataRange().getValues();
    const timezone = Session.getScriptTimeZone();
    const hojeFmt = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");
    
    const mapaMeses = {
      "JANEIRO": 0, "FEVEREIRO": 1, "MARCO": 2, "ABRIL": 3, "MAIO": 4, "JUNHO": 5,
      "JULHO": 6, "AGOSTO": 7, "SETEMBRO": 8, "OUTUBRO": 9, "NOVEMBRO": 10, "DEZEMBRO": 11
    };
    
    const mesIndex = mapaMeses[mesNome.toUpperCase()];
    const anoAlvo = String(anoInput).trim();
    
    let totalLinhas = 0;
    let pacientesUnicos = new Set();
    let listaItens = [];

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row[0] && !row[2]) continue;

      const dataRegistroOriginal = row[0];
      let registroValido = false;

      if (dataRegistroOriginal instanceof Date) {
        const strData = Utilities.formatDate(dataRegistroOriginal, "GMT-3", "MM/yyyy");
        const [m, a] = strData.split('/');
        if ((parseInt(m) - 1) === mesIndex && a === anoAlvo) registroValido = true;
      } else if (typeof dataRegistroOriginal === 'string') {
        try {
          const partes = dataRegistroOriginal.split(' ')[0].split('/');
          if (partes.length === 3) {
            if (parseInt(partes[1]) - 1 === mesIndex && partes[2] === anoAlvo) registroValido = true;
          }
        } catch (e) { /* ignora */ }
      }

      if (registroValido) {
        totalLinhas++;
        const paciente = String(row[2]).trim().toUpperCase();
        const guia = String(row[4]).trim();
        const tipo = String(row[6]).trim();
        
        let dataSessaoFmt = String(row[3]);
        if (row[3] instanceof Date) {
          dataSessaoFmt = Utilities.formatDate(row[3], timezone, "dd/MM/yyyy");
        }

        if (paciente) pacientesUnicos.add(paciente);
        
        listaItens.push({
          data: dataSessaoFmt,
          paciente: paciente,
          guia: guia,
          tipo: tipo,
          destaque: (dataSessaoFmt === hojeFmt)
        });
      }
    }

    listaItens.sort(function(a, b) {
      return a.paciente < b.paciente ? -1 : a.paciente > b.paciente ? 1 : 0;
    });

    const html = `
      <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #e65100; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { color: #e65100; margin: 0; font-size: 22px; }
        .header h2 { color: #555; margin: 5px 0; font-size: 14px; }
        .lgpd-box { border: 1px solid #e65100; background-color: #fff3e0; padding: 10px; border-radius: 5px; font-size: 10px; color: #e65100; margin-bottom: 20px; }
        .card-resumo { display: flex; justify-content: space-around; background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #ddd; }
        .resumo-valor { font-size: 24px; font-weight: bold; color: #333; text-align: center; }
        .resumo-label { font-size: 10px; color: #777; text-transform: uppercase; font-weight: bold; text-align: center; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px; }
        th { background-color: #ef6c00; color: white; padding: 8px; text-align: left; text-transform: uppercase; font-size: 9px; }
        td { border-bottom: 1px solid #ddd; padding: 6px; }
        tr:nth-child(even) { background-color: #fafafa; }
        .row-hoje { color: #0d47a1 !important; font-weight: bold; background-color: #bbdefb !important; }
        .footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 9px; color: #999; }
      </style>
      <div class="header">
        <h1>Relatório de Produção</h1>
        <h2>Profissional: ${NOME_PSICOLOGA} | Mês: ${mesNome}/${anoInput}</h2>
      </div>
      <div class="lgpd-box"><b>⚠️ Uso restrito</b> — Dados pessoais sob responsabilidade do profissional.</div>
      <div class="card-resumo">
        <div><div class="resumo-valor">${pacientesUnicos.size}</div><div class="resumo-label">Pacientes</div></div>
        <div><div class="resumo-valor">${totalLinhas}</div><div class="resumo-label">Sessões</div></div>
      </div>
      <table>
        <thead><tr><th>Data Sessão</th><th>Paciente</th><th>Guia</th><th>Tipo</th></tr></thead>
        <tbody>${listaItens.map(function(i) {
          return '<tr class="' + (i.destaque ? 'row-hoje' : '') + '"><td>' + i.data + '</td><td><b>' + i.paciente + '</b></td><td>' + i.guia + '</td><td>' + i.tipo + '</td></tr>';
        }).join('')}</tbody>
      </table>
      <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} via Clínica Hope.</div>
    `;

    const blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF);
    blob.setName("Producao_" + mesNome + "_" + anoInput + ".pdf");
    
    MailApp.sendEmail({
      to: EMAIL_ADMINISTRATIVO,
      subject: "📊 Relatório Produção: " + NOME_PSICOLOGA + " - " + mesNome + "/" + anoInput,
      htmlBody: "Relatório em anexo. Total: " + totalLinhas + " atendimentos.",
      attachments: [blob]
    });

    return {
      success: true,
      base64: Utilities.base64Encode(blob.getBytes()),
      filename: blob.getName(),
      msg: "Relatório gerado!"
    };
  } catch (e) {
    return { success: false, msg: "Erro: " + e.message };
  }
}

// =======================================================
// 10. MÓDULO CONFIGURADOR
// =======================================================
function AUTORIZAR_TUDO() {
  Session.getActiveUser().getEmail();
  MailApp.getRemainingDailyQuota();
  DriveApp.getRootFolder();
  SpreadsheetApp.getActiveSpreadsheet();
}

// =======================================================
// 11. MÓDULO AUTOMATIZAÇÃO FINANCEIRA
// =======================================================
const EMAIL_PRESTADOR = "siqueirapsicologia1@gmail.com";

/**
 * NOVA FUNÇÃO: Verifica configuração da aba "DataRPA/Nota"
 */
function getConfiguracaoAlertaFinanceiro() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName("DataRPA/Nota");
    
    if (!aba) {
      Logger.log("ℹ️ Aba 'DataRPA/Nota' não encontrada - alertas habilitados por padrão.");
      return { ativo: true, dataInicio: null, alertaLiberado: true };
    }
    
    const dados = aba.getRange("A2:B2").getValues()[0];
    const situacao = String(dados[0] || "").trim().toLowerCase();
    const dataInicioRaw = dados[1];
    
    if (situacao === "nao" || situacao === "não" || situacao === "n") {
      Logger.log("🔕 Alertas financeiros DESATIVADOS (Situação = não)");
      return { ativo: false, dataInicio: null, alertaLiberado: false };
    }
    
    if (situacao === "sim" || situacao === "s") {
      let dataInicio = null;
      
      if (dataInicioRaw instanceof Date) {
        dataInicio = dataInicioRaw;
      } else if (typeof dataInicioRaw === 'string' && dataInicioRaw.trim() !== '') {
        const partes = String(dataInicioRaw).trim().split('/');
        if (partes.length === 3) {
          dataInicio = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
        }
      }
      
      if (!dataInicio || isNaN(dataInicio.getTime())) {
        Logger.log("⚠️ Situação = sim mas DataInicio inválida - alertas ativados imediatamente.");
        return { ativo: true, dataInicio: null, alertaLiberado: true };
      }
      
      const mesInicio = dataInicio.getMonth();
      const anoInicio = dataInicio.getFullYear();
      const dataLimite = new Date(anoInicio, mesInicio + 1, 5);
      
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      dataLimite.setHours(0, 0, 0, 0);
      
      const alertaLiberado = (hoje >= dataLimite);
      
      Logger.log("📋 Configuração Alerta: Situação=sim | DataInicio=" + 
        Utilities.formatDate(dataInicio, Session.getScriptTimeZone(), "dd/MM/yyyy") +
        " | Alerta libera em=" + Utilities.formatDate(dataLimite, Session.getScriptTimeZone(), "dd/MM/yyyy") +
        " | Liberado agora=" + alertaLiberado);
      
      return { 
        ativo: true, 
        dataInicio: dataInicio, 
        alertaLiberado: alertaLiberado,
        dataLimite: dataLimite
      };
    }
    
    Logger.log("⚠️ Valor de Situação não reconhecido: '" + situacao + "' - alertas ativados.");
    return { ativo: true, dataInicio: null, alertaLiberado: true };
    
  } catch (e) {
    Logger.log("⚠️ Erro ao ler 'DataRPA/Nota': " + e.message + " - alertas ativados por padrão.");
    return { ativo: true, dataInicio: null, alertaLiberado: true };
  }
}

/**
 * FUNÇÃO MODIFICADA: Agora consulta a aba "DataRPA/Nota" antes de verificar pendências
 */
function verificarPendenciaFinanceira() {
  const configAlerta = getConfiguracaoAlertaFinanceiro();
  
  if (!configAlerta.ativo) {
    return { codigo: "OK", mesReferencia: "" };
  }
  
  if (!configAlerta.alertaLiberado) {
    Logger.log("⏳ Alertas ainda não liberados. Aguardando data limite.");
    return { codigo: "OK", mesReferencia: "" };
  }
  
  const hoje = new Date();
  const diaUtil = calcularDiaUtilHoje(hoje);

  const statusAntigo = _consultarDadosPlanilha(2);
  if (statusAntigo.codigo !== "OK") {
    statusAntigo.prioridade = "ALTA";
    return statusAntigo;
  }

  const statusRecente = _consultarDadosPlanilha(1);
  if (statusRecente.codigo !== "OK") {
    if (diaUtil < 5) return { codigo: "OK", mesReferencia: statusRecente.mesReferencia };
    statusRecente.prioridade = "NORMAL";
    return statusRecente;
  }

  return { codigo: "OK", mesReferencia: "" };
}

function verificarEEnviarEmailsAutomaticos() {
  const status = verificarPendenciaFinanceira();
  if (status.codigo === "OK") return "Tudo OK";

  const mesRef = status.mesReferencia;
  let assunto = "", corpo = "";
  const rodape = '<br><br><hr><span style="font-size:11px; color:#555;"><i>🤖 Email automático - APP HOPE.</i></span>';

  if (status.codigo === "FALTA_RPA") {
    assunto = "⚠️ PENDÊNCIA: Falta o RPA (" + mesRef + ")";
    corpo = "Olá, " + NOME_PSICOLOGA + ".<br><br>Falta o <b>RPA</b> de <b>" + mesRef + "</b>.";
  } else if (status.codigo === "FALTA_NOTA") {
    assunto = "⚠️ PENDÊNCIA: Falta a Nota Fiscal (" + mesRef + ")";
    corpo = "Olá, " + NOME_PSICOLOGA + ".<br><br>Falta a <b>Nota Fiscal</b> de <b>" + mesRef + "</b>.";
  } else if (status.codigo === "PENDENTE_TOTAL") {
    assunto = "🚨 ATENÇÃO: Nota e RPA (" + mesRef + ")";
    corpo = "Olá, " + NOME_PSICOLOGA + ".<br><br>Falta Nota + RPA de <b>" + mesRef + "</b>.";
  }

  if (assunto) {
    MailApp.sendEmail({ to: EMAIL_PRESTADOR, subject: assunto, htmlBody: corpo + rodape });
  }
  return "Executado";
}

function calcularDiaUtilHoje(dataRef) {
  const ano = dataRef.getFullYear(), mes = dataRef.getMonth(), dia = dataRef.getDate();
  let uteis = 0;
  for (let d = 1; d <= dia; d++) {
    const s = new Date(ano, mes, d).getDay();
    if (s !== 0 && s !== 6) uteis++;
  }
  return (dataRef.getDay() === 0 || dataRef.getDay() === 6) ? 0 : uteis;
}

function _consultarDadosPlanilha(mesesRecuo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const aba = ss.getSheetByName(ABA_NOTA);
    const hoje = new Date();
    const dataAlvo = new Date(hoje.getFullYear(), hoje.getMonth() - mesesRecuo, 1);
    
    const meses = ["JANEIRO", "FEVEREIRO", "MARCO", "ABRIL", "MAIO", "JUNHO",
                   "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];
    const nomeMes = meses[dataAlvo.getMonth()];
    const anoRef = String(dataAlvo.getFullYear());
    const refTexto = nomeMes + "/" + anoRef;

    if (!aba) return { codigo: "OK", mesReferencia: refTexto };

    const dados = aba.getDataRange().getValues();
    let temNota = false, temRPA = false;

    for (let i = 1; i < dados.length; i++) {
      if (String(dados[i][3]).trim().toUpperCase() === nomeMes && String(dados[i][4]).trim() === anoRef) {
        if (String(dados[i][1]).trim() !== "") temNota = true;
        if (String(dados[i][2]).trim() !== "") temRPA = true;
      }
    }

    if (temNota && temRPA) return { codigo: "OK", mesReferencia: refTexto };
    if (temNota && !temRPA) return { codigo: "FALTA_RPA", mesReferencia: refTexto };
    if (!temNota && temRPA) return { codigo: "FALTA_NOTA", mesReferencia: refTexto };
    return { codigo: "PENDENTE_TOTAL", mesReferencia: refTexto };
  } catch (e) {
    return { codigo: "OK", mesReferencia: "" };
  }
}

// =======================================================
// 12. MÓDULO GATILHOS
// =======================================================
function CONFIGURAR_AGENDAMENTO_7H() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "verificarEEnviarEmailsAutomaticos") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("verificarEEnviarEmailsAutomaticos").timeBased().everyDays(1).atHour(7).create();
  Browser.msgBox("✅ Agendamento configurado!");
}

function TESTAR_ENVIO_AGORA() {
  const res = verificarEEnviarEmailsAutomaticos();
  SpreadsheetApp.getActiveSpreadsheet().toast("Status: " + res);
}

// =======================================================
// 15. MÓDULO RELATÓRIO "VALOR A RECEBER"
// =======================================================
function gerarRelatorioValorReceber(mesNome, anoInput) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtend = ss.getSheetByName(ABA_REGISTRO);
    if (!abaAtend) throw new Error("Aba de Atendimentos não encontrada.");

    const mapaMeses = {
      "JANEIRO":0,"FEVEREIRO":1,"MARCO":2,"ABRIL":3,"MAIO":4,"JUNHO":5,
      "JULHO":6,"AGOSTO":7,"SETEMBRO":8,"OUTUBRO":9,"NOVEMBRO":10,"DEZEMBRO":11
    };
    const mesIndex = mapaMeses[mesNome.toUpperCase()];
    const anoAlvo = parseInt(anoInput);
    
    const dados = abaAtend.getDataRange().getValues();
    const timezone = Session.getScriptTimeZone();
    const hojeFmt = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy");

    let totalProducao100 = 0;
    let listaPacientesPagos = new Set();
    let countSessoesPagos = 0;
    let listaFinanceira = [];
    let listaCompletaAuditoria = [];
    let listaPacientesAuditoria = new Set();

    for (let i = 1; i < dados.length; i++) {
      const row = dados[i];
      if (!row[0] && !row[2]) continue;

      const dataRegistro = row[0];
      const dataSessao = row[3];
      const paciente = String(row[2]).trim();
      const numGuia = String(row[4]);
      const infoSessao = String(row[6]);
      
      let valorCheio = converterValorParaNumero(row[13]);
      
      const statusColunaS = String(row[18] || "").trim().toUpperCase();

      let mesReg = -1, anoReg = -1;

      if (dataRegistro instanceof Date) {
        const strData = Utilities.formatDate(dataRegistro, "GMT-3", "MM/yyyy");
        mesReg = parseInt(strData.split('/')[0]) - 1;
        anoReg = parseInt(strData.split('/')[1]);
      } else {
        try {
          const str = String(dataRegistro).trim().split(' ')[0];
          const partes = str.split('/');
          if (partes.length === 3) {
            mesReg = parseInt(partes[1]) - 1;
            anoReg = parseInt(partes[2]);
          }
        } catch (e) { /* ignora */ }
      }

      if (mesReg !== mesIndex || anoReg !== anoAlvo) continue;

      let dataFmt = "", dataObj = null;
      if (dataSessao instanceof Date) {
        dataFmt = Utilities.formatDate(dataSessao, timezone, "dd/MM/yyyy");
        dataObj = dataSessao;
      } else {
        dataFmt = String(dataSessao);
      }

      const item = {
        dataObj: dataObj,
        data: dataFmt,
        paciente: paciente,
        guia: numGuia,
        sessao: infoSessao,
        status: statusColunaS || "PENDENTE",
        valorRepasse: (statusColunaS === "OK") ? (valorCheio * 0.40) : 0,
        destaque: (dataFmt === hojeFmt)
      };

      listaCompletaAuditoria.push(item);
      if (paciente) listaPacientesAuditoria.add(paciente);

      if (statusColunaS === "OK") {
        totalProducao100 += valorCheio;
        listaPacientesPagos.add(paciente);
        countSessoesPagos++;
        listaFinanceira.push(item);
      }
    }

    const sortFn = function(a, b) {
      const cmp = a.paciente.localeCompare(b.paciente, 'pt-BR', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      if (a.dataObj && b.dataObj) return a.dataObj - b.dataObj;
      return 0;
    };
    listaFinanceira.sort(sortFn);
    listaCompletaAuditoria.sort(sortFn);

    const valorBruto40 = totalProducao100 * 0.40;
    const nomeNorm = NOME_PSICOLOGA.toUpperCase();
    const isIsenta = nomeNorm.includes("LANA") || nomeNorm.includes("SUELLEN");
    const valorINSS = isIsenta ? 0 : valorBruto40 * 0.11;
    const valorLiquido = valorBruto40 - valorINSS;

    const dataHoraGeracao = Utilities.formatDate(new Date(), timezone, "dd/MM/yyyy HH:mm:ss");
    const transacaoID = Utilities.getUuid().substring(0, 18).toUpperCase();

    const html = `
      <style>
        body { font-family: 'Helvetica', sans-serif; color: #333; padding: 30px; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #004d40; padding-bottom: 10px; }
        .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; color: #004d40; }
        .financeiro-box { background: #fff; border: 1px solid #ccc; padding: 12px; border-radius: 5px; margin-bottom: 20px; }
        .fin-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 11px; }
        .fin-total { border-top: 2px solid #333; padding-top: 8px; font-size: 14px; font-weight: bold; margin-top: 5px; }
        .destaque-negativo { color: #d32f2f; }
        h3 { font-size: 12px; margin-top: 15px; border-left: 4px solid #004d40; padding-left: 5px; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 15px; }
        th { background: #004d40; color: #fff; padding: 5px; text-align: left; }
        td { border-bottom: 1px solid #ddd; padding: 4px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .valor-col { text-align: right; }
        .footer { font-size: 8px; text-align: center; color: #999; margin-top: 10px; border-top: 1px solid #eee; padding-top: 5px; }
        .linha-hoje { background-color: #e3f2fd !important; }
        .texto-hoje { color: #0d47a1 !important; font-weight: bold; }
        .status-ok { color: #2e7d32; font-weight: bold; }
        .status-erro { color: #d32f2f; font-weight: bold; }
      </style>
      <div class="header">
        <h1>Demonstrativo de Repasse</h1>
        <p style="margin:0; font-size:11px;">Profissional: <b>${NOME_PSICOLOGA}</b> | Ref: <b>${mesNome}/${anoInput}</b></p>
      </div>
      <div class="financeiro-box">
        <div style="text-align:center; font-weight:bold; margin-bottom:8px; font-size:12px;">RESUMO</div>
        <div class="fin-row"><span>(=) Repasse Bruto (40%):</span><span>R$ ${valorBruto40.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
        <div class="fin-row destaque-negativo"><span>(-) INSS (11%):</span><span>R$ ${valorINSS.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
        <div class="fin-row fin-total"><span>LÍQUIDO:</span><span>R$ ${valorLiquido.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span></div>
      </div>
      <h3>1. Créditos Pagos (A-Z)</h3>
      <p style="font-size:9px;">Pacientes: ${listaPacientesPagos.size} | Sessões: ${countSessoesPagos}</p>
      <table>
        <thead><tr><th>Data</th><th>Paciente</th><th>Guia</th><th>Sessão</th><th class="valor-col">Repasse</th></tr></thead>
        <tbody>${listaFinanceira.map(function(i) {
          return '<tr><td>' + i.data + '</td><td><b>' + i.paciente + '</b></td><td>' + i.guia + '</td><td>' + i.sessao + '</td><td class="valor-col">R$ ' + i.valorRepasse.toLocaleString('pt-BR',{minimumFractionDigits:2}) + '</td></tr>';
        }).join('')}</tbody>
      </table>
      <h3>2. Auditoria Completa</h3>
      <p style="font-size:10px; font-weight:bold;">Pacientes: ${listaPacientesAuditoria.size} | Sessões: ${listaCompletaAuditoria.length}</p>
      <table>
        <thead><tr><th>Data</th><th>Paciente</th><th>Guia</th><th>Status</th></tr></thead>
        <tbody>${listaCompletaAuditoria.map(function(i) {
          var cls = i.destaque ? 'linha-hoje' : '';
          var txtCls = i.destaque ? 'texto-hoje' : '';
          var stsCls = i.status === 'OK' ? 'status-ok' : 'status-erro';
          return '<tr class="' + cls + '"><td class="' + txtCls + '">' + i.data + '</td><td class="' + txtCls + '">' + i.paciente + '</td><td class="' + txtCls + '">' + i.guia + '</td><td class="' + stsCls + '">' + i.status + '</td></tr>';
        }).join('')}</tbody>
      </table>
      <div class="footer">Gerado em ${dataHoraGeracao} | ID: ${transacaoID}</div>
    `;

    const blob = Utilities.newBlob(html, MimeType.HTML).getAs(MimeType.PDF);
    const nomeArquivo = "Fechamento_" + mesNome + "_" + anoInput + "_" + NOME_PSICOLOGA.replace(/ /g, "_") + ".pdf";
    blob.setName(nomeArquivo);

    MailApp.sendEmail({
      to: EMAIL_ADMINISTRATIVO,
      subject: "💰 Relatório: " + NOME_PSICOLOGA + " - " + mesNome + "/" + anoInput,
      htmlBody: "Relatório gerado.<br>Líquido: R$ " + valorLiquido.toLocaleString('pt-BR',{minimumFractionDigits:2}),
      attachments: [blob]
    });

    return { success: true, base64: Utilities.base64Encode(blob.getBytes()), filename: nomeArquivo, msg: "Relatório gerado!" };
  } catch (e) {
    return { success: false, msg: "Erro: " + e.message };
  }
}

// =======================================================
// 16. MÓDULO GUIAS - BUSCA CENTRAL
// =======================================================
function buscarGuiasCentral(mes, ano, paciente) {
  try {
    const ID_PLANILHA_CENTRAL = "1UfPPZYnNoEPyMzqAP3TtxB9Sjyg9KxePcVRmIZk-TeA";
    const ssCentral = SpreadsheetApp.openById(ID_PLANILHA_CENTRAL);
    const abaGuias = ssCentral.getSheetByName("BD_GUIAS");
    const dadosCentral = abaGuias.getDataRange().getValues();
    
    const ssLocal = SpreadsheetApp.getActiveSpreadsheet();
    const abaAtendimentos = ssLocal.getSheetByName("Atendimentos");
    const guiasRegistradasLocal = abaAtendimentos
      ? abaAtendimentos.getRange("E2:E").getValues().flat().map(String)
      : [];

    let guiasDisponiveis = [];
    let guiasDoMesJaSalvas = [];

    for (let i = 1; i < dadosCentral.length; i++) {
      const linha = dadosCentral[i];
      if (String(linha[1]) == mes && String(linha[2]) == ano &&
          String(linha[4]).toUpperCase() === paciente.toUpperCase()) {
        
        for (let col = 6; col <= 15; col++) {
          let numGuia = String(linha[col]).trim();
          if (numGuia && numGuia !== "" && numGuia !== "undefined") {
            if (guiasRegistradasLocal.includes(numGuia)) {
              if (!guiasDoMesJaSalvas.includes(numGuia)) guiasDoMesJaSalvas.push(numGuia);
            } else {
              if (!guiasDisponiveis.includes(numGuia)) guiasDisponiveis.push(numGuia);
            }
          }
        }
      }
    }

    return { disponiveis: guiasDisponiveis, registradas: guiasDoMesJaSalvas.join(", ") };
  } catch (e) {
    throw new Error("Erro ao buscar guias: " + e.message);
  }
}

function buscarGuiasDisponiveis(mes, ano, paciente) {
  try {
    const ID_CENTRAL = "1UfPPZYnNoEPyMzqAP3TtxB9Sjyg9KxePcVRmIZk-TeA";
    const ssCentral = SpreadsheetApp.openById(ID_CENTRAL);
    const abaCentral = ssCentral.getSheetByName("BD_GUIAS");
    if (!abaCentral) throw new Error("Aba 'BD_GUIAS' não encontrada");
    
    const dadosCentral = abaCentral.getDataRange().getValues();
    
    const ssLocal = SpreadsheetApp.getActiveSpreadsheet();
    const abaLocal = ssLocal.getSheetByName("Atendimentos");
    const guiasJaSalvas = [];
    
    if (abaLocal) {
      const dadosLocal = abaLocal.getDataRange().getValues();
      for (let i = 1; i < dadosLocal.length; i++) {
        const pacienteLocal = String(dadosLocal[i][2] || "").trim();
        const guiaLocal = String(dadosLocal[i][4] || "").trim();
        if (pacienteLocal.toUpperCase() === paciente.toUpperCase() && guiaLocal) {
          guiasJaSalvas.push(guiaLocal);
        }
      }
    }
    
    const mesNumero = parseInt(mes);
    const anoNumero = parseInt(ano);
    let disponiveis = [], jaRegistradas = [];
    
    const mesesMap = {
      'JANEIRO':1,'FEVEREIRO':2,'MARÇO':3,'MARCO':3,'ABRIL':4,
      'MAIO':5,'JUNHO':6,'JULHO':7,'AGOSTO':8,'SETEMBRO':9,
      'OUTUBRO':10,'NOVEMBRO':11,'DEZEMBRO':12
    };

    for (let i = 1; i < dadosCentral.length; i++) {
      const linha = dadosCentral[i];
      let mesLinha = typeof linha[1] === 'string'
        ? (mesesMap[linha[1].toUpperCase()] || parseInt(linha[1]))
        : linha[1];
      
      if (mesLinha === mesNumero && parseInt(linha[2]) === anoNumero &&
          String(linha[4] || "").trim().toUpperCase() === paciente.toUpperCase()) {
        
        for (let col = 6; col <= 15; col++) {
          let numGuia = String(linha[col] || "").trim().replace(/\s+/g, '');
          if (numGuia && numGuia !== "undefined") {
            if (guiasJaSalvas.includes(numGuia)) {
              if (!jaRegistradas.includes(numGuia)) jaRegistradas.push(numGuia);
            } else {
              if (!disponiveis.includes(numGuia)) disponiveis.push(numGuia);
            }
          }
        }
      }
    }
    
    return { disponiveis: disponiveis.sort(), registradas: jaRegistradas.sort().join(", ") };
  } catch (e) {
    Logger.log("Erro buscarGuiasDisponiveis: " + e.message);
    throw new Error("Erro na busca: " + e.message);
  }
}

// =======================================================
// 17. MÊS ATUAL
// =======================================================
function getMesAtual() {
  const d = new Date();
  const meses = ["","JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO",
                 "JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
  return { numero: d.getMonth() + 1, nome: meses[d.getMonth() + 1], ano: d.getFullYear() };
}

// =======================================================
// 18. API REST — Bridge GitHub Pages ↔ Apps Script
// ✅ CORRIGIDO: doGet() retorna SEMPRE JSON (nunca HTML)
// =======================================================
function doGet(e) {
  try {
    // Se tem parâmetro "action", funciona como API
    if (e && e.parameter && e.parameter.action) {
      var action = e.parameter.action;
      var params = e.parameter.params ? JSON.parse(e.parameter.params) : {};
      var result;

      switch (action) {
        case "getConfiguracoesIniciais":
          result = getConfiguracoesIniciais(); break;
        case "verificarPendenciaFinanceira":
          result = verificarPendenciaFinanceira(); break;
        case "getDadosDaAgenda":
          result = getDadosDaAgenda(); break;
        case "getPacientes":
          result = getPacientes(); break;
        case "moverAgendamento":
          result = moverAgendamento(params.paciente, params.diaAtual, params.horaAtual, params.diaNovo, params.horaNova); break;
        case "salvarRegistroComAnexo":
          result = salvarRegistroComAnexo(params.dados); break;
        case "darAltaPaciente":
          result = darAltaPaciente(params.nome, params.motivo); break;
        case "salvarFinanceiro":
          result = salvarFinanceiro(params.dados); break;
        case "gerarRelatorioFinanceiroPDF":
          result = gerarRelatorioFinanceiroPDF(params.mes, params.ano); break;
        case "gerarRelatorioValorReceber":
          result = gerarRelatorioValorReceber(params.mes, params.ano); break;
        case "buscarGuiasDisponiveis":
          result = buscarGuiasDisponiveis(params.mes, params.ano, params.paciente); break;
        case "getHistoricoFinanceiro":
          result = getHistoricoFinanceiro(); break;
        default:
          result = { error: "Acao desconhecida: " + action };
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
        .setMimeType(ContentService.MimeType.JSON);

    }

    // Se tem mode=agenda, retorna JSON da agenda
    if (e && e.parameter && e.parameter.mode === "agenda") {
      return ContentService.createTextOutput(JSON.stringify(getDadosDaAgenda()))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ✅ SEGURO: Sem parâmetros, retorna JSON vazio (não HTML)
    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      data: { message: "API funcionando. Use o parâmetro ?action=..." } 
    }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ✅ CORRIGIDO: doPost() também retorna SEMPRE JSON
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var params = body.params || {};
    var result;

    switch (action) {
      case "getConfiguracoesIniciais":
        result = getConfiguracoesIniciais(); break;
      case "verificarPendenciaFinanceira":
        result = verificarPendenciaFinanceira(); break;
      case "getDadosDaAgenda":
        result = getDadosDaAgenda(); break;
      case "getPacientes":
        result = getPacientes(); break;
      case "moverAgendamento":
        result = moverAgendamento(params.paciente, params.diaAtual, params.horaAtual, params.diaNovo, params.horaNova); break;
      case "salvarRegistroComAnexo":
        result = salvarRegistroComAnexo(params.dados); break;
      case "darAltaPaciente":
        result = darAltaPaciente(params.nome, params.motivo); break;
      case "salvarFinanceiro":
        result = salvarFinanceiro(params.dados); break;
      case "gerarRelatorioFinanceiroPDF":
        result = gerarRelatorioFinanceiroPDF(params.mes, params.ano); break;
      case "gerarRelatorioValorReceber":
        result = gerarRelatorioValorReceber(params.mes, params.ano); break;
      case "buscarGuiasDisponiveis":
        result = buscarGuiasDisponiveis(params.mes, params.ano, params.paciente); break;
      case "getHistoricoFinanceiro":
        result = getHistoricoFinanceiro(); break;
      default:
        result = { error: "Acao desconhecida: " + action };
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, data: result }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
