import QRCode from "qrcode";

/**
 * Gera o payload "Copia e Cola" do PIX seguindo o padrão EMV/BR Code do
 * Banco Central, com valor e identificador (txid) fixos por fatura.
 *
 * Importante: isso NÃO depende de nenhum provedor de pagamento — é só
 * codificação de um payload público e documentado pelo Bacen. A confirmação
 * automática (Fase 2) troca apenas QUEM GERA esse código (você vs. a API de
 * um provedor), o `txid` continua sendo o mesmo identificador salvo em
 * `faturas.pix_txid`.
 */

function field(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

/** CRC16-CCITT (0xFFFF), exigido no final do payload BR Code. */
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Remove acentos e caracteres fora do padrão aceito pelos campos do BR Code. */
function sanitizar(valor: string, tamanhoMaximo: number): string {
  const semAcento = valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .toUpperCase()
    .trim();
  return semAcento.slice(0, tamanhoMaximo) || "NA";
}

export interface DadosPix {
  chave: string;
  nomeRecebedor: string;
  cidade: string;
  valor: number;
  txid: string; // identificador único da fatura — vira faturas.pix_txid
  descricao?: string;
}

export function gerarPayloadPix(dados: DadosPix): string {
  const nome = sanitizar(dados.nomeRecebedor, 25);
  const cidade = sanitizar(dados.cidade, 15);
  // txid: só alfanumérico, até 25 caracteres (regra do Bacen)
  const txid = dados.txid.replace(/[^a-zA-Z0-9]/g, "").slice(0, 25) || "***";

  const merchantAccountInfo =
    field("00", "br.gov.bcb.pix") + field("01", dados.chave);

  const additionalData = field("05", txid);

  let payload =
    field("00", "01") + // Payload Format Indicator
    field("26", merchantAccountInfo) + // Merchant Account Info (PIX)
    field("52", "0000") + // Merchant Category Code
    field("53", "986") + // Moeda: Real (BRL)
    field("54", dados.valor.toFixed(2)) + // Valor da transação
    field("58", "BR") + // País
    field("59", nome) + // Nome do recebedor
    field("60", cidade) + // Cidade do recebedor
    field("62", additionalData); // Identificador da cobrança (txid)

  payload += "6304"; // ID + tamanho fixo do CRC, valor calculado a seguir
  const crc = crc16(payload);
  return payload + crc;
}

/** Gera o QR Code como data URL (PNG em base64), pronto para <img src="...">. */
export async function gerarQrCodeDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { margin: 1, width: 320 });
}
