export interface ContractData {
  razaoSocialLoja: string;
  cnpjLoja: string;
  enderecoLoja: string;
  representanteLoja: string;
  cpfRepresentanteLoja: string;
  telefoneLoja: string;
  
  nomeCliente: string;
  cpfCnpjCliente: string;
  tipoDocumentoCliente: "CPF" | "CNPJ";
  rgCliente: string;
  cnhCliente: string;
  enderecoCliente: string;
  telefoneCliente: string;
  emailCliente: string;
  
  marca: string;
  modelo: string;
  ano: string;
  cor: string;
  placa: string;
  chassi: string;
  renavam: string;
  km: string;
  
  valorVeiculo: string;
  entradaTotal: string;
  entradaPaga: string;
  entradaRestante: string;
  valorFinanciado: string;
  bancoFinanciador: string;
  
  formaPagamento: "avista" | "parcelado";
  dataVencimentoAvista: string;
  quantidadeParcelas: number;
  valorParcela: string;
  diaVencimento: number;
  formaPagamentoParcelas: string;
  
  multaPercentual: string;
  jurosMensal: string;
  
  cidadeForo: string;
  dataEmissao: string;
}

export function getEntryComplementContract(data: ContractData): string {
  const pagamentoSection = data.formaPagamento === "avista" 
    ? `
CLÁUSULA TERCEIRA - DA FORMA DE PAGAMENTO

3.1. O COMPRADOR compromete-se a pagar o valor restante da entrada, no montante de ${data.entradaRestante}, em parcela única, mediante pagamento à vista, com vencimento para o dia ${data.dataVencimentoAvista}.

3.2. O pagamento deverá ser realizado através de transferência bancária (PIX ou TED) para a conta indicada pela VENDEDORA, ou por outro meio expressamente autorizado por esta.

3.3. O comprovante de pagamento deverá ser apresentado à VENDEDORA para fins de quitação e registro.
`
    : `
CLÁUSULA TERCEIRA - DA FORMA DE PAGAMENTO

3.1. O COMPRADOR compromete-se a pagar o valor restante da entrada, no montante de ${data.entradaRestante}, de forma parcelada, nas seguintes condições:

    a) Quantidade de parcelas: ${data.quantidadeParcelas} (${numberToWords(data.quantidadeParcelas)}) parcelas;
    b) Valor de cada parcela: ${data.valorParcela};
    c) Data de vencimento: todo dia ${data.diaVencimento} de cada mês;
    d) Forma de pagamento: ${formatPaymentMethod(data.formaPagamentoParcelas)};

3.2. A primeira parcela terá seu vencimento 30 (trinta) dias após a data de assinatura deste instrumento.

3.3. O pagamento deverá ser realizado através de ${formatPaymentMethod(data.formaPagamentoParcelas)}, conforme orientações fornecidas pela VENDEDORA.

3.4. Os comprovantes de pagamento deverão ser apresentados à VENDEDORA para fins de baixa e registro das parcelas quitadas.
`;

  return `
CONTRATO PARTICULAR DE COMPLEMENTO DE ENTRADA PARA AQUISIÇÃO DE VEÍCULO

Pelo presente instrumento particular, de um lado:

VENDEDORA: ${data.razaoSocialLoja}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.cnpjLoja}, com sede na ${data.enderecoLoja}, neste ato representada por ${data.representanteLoja}, inscrito(a) no CPF sob o nº ${data.cpfRepresentanteLoja}, doravante denominada simplesmente "VENDEDORA";

e, de outro lado:

COMPRADOR(A): ${data.nomeCliente}, inscrito(a) no ${data.tipoDocumentoCliente} sob o nº ${data.cpfCnpjCliente}, ${data.tipoDocumentoCliente === "CPF" ? `portador(a) do RG nº ${data.rgCliente}, CNH nº ${data.cnhCliente}, ` : ""}residente e domiciliado(a) na ${data.enderecoCliente}, telefone ${data.telefoneCliente}, e-mail ${data.emailCliente}, doravante denominado(a) simplesmente "COMPRADOR(A)";

têm entre si justo e contratado o seguinte:


CLÁUSULA PRIMEIRA - DO OBJETO

1.1. O presente contrato tem por objeto formalizar o compromisso de pagamento do valor restante da entrada referente à aquisição do veículo abaixo descrito:

    Marca: ${data.marca}
    Modelo: ${data.modelo}
    Ano de Fabricação/Modelo: ${data.ano}
    Cor: ${data.cor}
    Placa: ${data.placa}
    Chassi: ${data.chassi}
    RENAVAM: ${data.renavam}
    Quilometragem: ${data.km} km

1.2. O COMPRADOR declara conhecer o veículo objeto deste contrato, tendo-o examinado e encontrado em perfeitas condições de uso e funcionamento.


CLÁUSULA SEGUNDA - DO VALOR E COMPOSIÇÃO DA ENTRADA

2.1. O valor total do veículo foi ajustado entre as partes em ${data.valorVeiculo}.

2.2. A entrada total acordada para a aquisição do veículo corresponde ao valor de ${data.entradaTotal}.

2.3. O COMPRADOR realizou, no ato desta transação, o pagamento parcial da entrada no valor de ${data.entradaPaga}.

2.4. O valor restante da entrada, objeto principal deste contrato, corresponde a ${data.entradaRestante}, que será pago conforme as condições estabelecidas na Cláusula Terceira.

${pagamentoSection}

CLÁUSULA QUARTA - DA MULTA, JUROS E INADIMPLÊNCIA

4.1. Em caso de atraso no pagamento de qualquer parcela ou do valor total, o COMPRADOR incorrerá em:

    a) Multa moratória de ${data.multaPercentual}% (${numberToWords(parseFloat(data.multaPercentual))} por cento) sobre o valor em atraso;
    b) Juros de mora de ${data.jurosMensal}% (${numberToWords(parseFloat(data.jurosMensal))} por cento) ao mês, calculados pro rata die;
    c) Atualização monetária pelo índice IGP-M/FGV ou, na sua falta, pelo IPCA/IBGE.

4.2. O não pagamento de qualquer parcela por prazo superior a 30 (trinta) dias importará no vencimento antecipado de todas as demais parcelas vincendas, tornando-se exigível imediatamente a totalidade do débito remanescente, acrescido de multa, juros e correção monetária.

4.3. A tolerância da VENDEDORA quanto a eventuais atrasos não constituirá novação ou alteração das condições pactuadas, permanecendo em vigor todas as cláusulas deste contrato.


CLÁUSULA QUINTA - DAS OBRIGAÇÕES DAS PARTES

5.1. São obrigações do COMPRADOR:

    a) Efetuar o pagamento do valor restante da entrada nas condições e prazos estabelecidos neste instrumento;
    b) Manter seus dados cadastrais atualizados junto à VENDEDORA;
    c) Comunicar imediatamente qualquer alteração de endereço, telefone ou e-mail;
    d) Apresentar os comprovantes de pagamento sempre que solicitado pela VENDEDORA;
    e) Cumprir integralmente as demais obrigações assumidas no Contrato de Compra e Venda.

5.2. São obrigações da VENDEDORA:

    a) Emitir os recibos correspondentes aos pagamentos recebidos;
    b) Fornecer ao COMPRADOR todas as informações necessárias para a efetivação dos pagamentos;
    c) Proceder à baixa das parcelas quitadas em seus registros internos;
    d) Cumprir as obrigações assumidas no Contrato de Compra e Venda vinculado a este instrumento.


CLÁUSULA SEXTA - DA RESCISÃO E PENALIDADES

6.1. O descumprimento de qualquer cláusula deste contrato por qualquer das partes ensejará sua rescisão de pleno direito, independentemente de notificação judicial ou extrajudicial.

6.2. Em caso de rescisão por culpa do COMPRADOR:

    a) A VENDEDORA poderá reter o percentual de 20% (vinte por cento) do valor já pago, a título de perdas e danos, custos administrativos e depreciação do veículo;
    b) O saldo remanescente será devolvido ao COMPRADOR no prazo de 30 (trinta) dias, após deduzidas as penalidades cabíveis;
    c) A VENDEDORA poderá exigir a imediata devolução do veículo, se este já tiver sido entregue.

6.3. Em caso de rescisão por culpa da VENDEDORA, esta deverá restituir integralmente os valores pagos pelo COMPRADOR, acrescidos de correção monetária pelo IGP-M/FGV, no prazo de 15 (quinze) dias.


CLÁUSULA SÉTIMA - DAS DISPOSIÇÕES GERAIS

7.1. Este contrato é acessório e complementar ao Contrato de Compra e Venda do veículo identificado na Cláusula Primeira, sendo ambos interdependentes.

7.2. A nulidade ou invalidade de qualquer cláusula não prejudicará as demais, que permanecerão em pleno vigor.

7.3. Qualquer alteração deste contrato somente será válida se realizada por escrito e assinada por ambas as partes.

7.4. As partes declaram que este contrato foi celebrado de livre e espontânea vontade, após a leitura integral de seu conteúdo.


CLÁUSULA OITAVA - DO FORO

8.1. Fica eleito o foro da Comarca de ${data.cidadeForo} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.


E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença de duas testemunhas.


${data.cidadeForo}, ${data.dataEmissao}




_____________________________________________
${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
VENDEDORA




_____________________________________________
${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
COMPRADOR(A)




TESTEMUNHAS:


1. _____________________________________________
   Nome:
   CPF:


2. _____________________________________________
   Nome:
   CPF:
`;
}


export function getPurchaseSaleContract(data: ContractData): string {
  const financiamentoSection = data.valorFinanciado && parseFloat(data.valorFinanciado.replace(/\D/g, '')) > 0 
    ? `
3.4. Do valor total, o montante de ${data.valorFinanciado} será objeto de financiamento junto à instituição financeira ${data.bancoFinanciador}, ficando o COMPRADOR responsável por cumprir todas as exigências e condições impostas pela referida instituição.

3.5. A aprovação do financiamento é condição suspensiva para a efetivação da venda, de modo que, não sendo aprovado, as partes retornarão ao estado anterior, com a devolução integral dos valores pagos pelo COMPRADOR.
`
    : '';

  const complementoEntradaSection = data.entradaRestante && parseFloat(data.entradaRestante.replace(/\D/g, '')) > 0
    ? `
3.6. O valor restante da entrada, no montante de ${data.entradaRestante}, será pago conforme as condições estabelecidas no CONTRATO PARTICULAR DE COMPLEMENTO DE ENTRADA, que é parte integrante e indissociável deste instrumento, vinculando-se a ele para todos os efeitos legais.
`
    : '';

  return `
CONTRATO PARTICULAR DE COMPRA E VENDA DE VEÍCULO AUTOMOTOR

Pelo presente instrumento particular, de um lado:

VENDEDORA: ${data.razaoSocialLoja}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.cnpjLoja}, com sede na ${data.enderecoLoja}, neste ato representada por ${data.representanteLoja}, inscrito(a) no CPF sob o nº ${data.cpfRepresentanteLoja}, telefone ${data.telefoneLoja}, doravante denominada simplesmente "VENDEDORA";

e, de outro lado:

COMPRADOR(A): ${data.nomeCliente}, inscrito(a) no ${data.tipoDocumentoCliente} sob o nº ${data.cpfCnpjCliente}, ${data.tipoDocumentoCliente === "CPF" ? `portador(a) do RG nº ${data.rgCliente}, CNH nº ${data.cnhCliente}, ` : ""}residente e domiciliado(a) na ${data.enderecoCliente}, telefone ${data.telefoneCliente}, e-mail ${data.emailCliente}, doravante denominado(a) simplesmente "COMPRADOR(A)";

têm entre si justo e contratado a compra e venda de veículo automotor, mediante as seguintes cláusulas e condições:


CLÁUSULA PRIMEIRA - DO OBJETO

1.1. A VENDEDORA, na qualidade de legítima proprietária e possuidora, vende ao COMPRADOR, que aceita e adquire, o veículo automotor abaixo descrito e caracterizado:

    Marca: ${data.marca}
    Modelo: ${data.modelo}
    Ano de Fabricação/Modelo: ${data.ano}
    Cor: ${data.cor}
    Placa: ${data.placa}
    Chassi: ${data.chassi}
    RENAVAM: ${data.renavam}
    Quilometragem: ${data.km} km
    Combustível: Conforme documento do veículo

1.2. A VENDEDORA declara que o veículo objeto desta venda encontra-se livre e desembaraçado de quaisquer ônus, gravames, débitos de multas, IPVA, licenciamento, seguro obrigatório (DPVAT) ou quaisquer outras pendências perante órgãos de trânsito, até a presente data.

1.3. O COMPRADOR declara ter examinado o veículo, conhecendo seu estado de conservação, funcionamento mecânico e estético, aceitando-o no estado em que se encontra.


CLÁUSULA SEGUNDA - DO PREÇO E CONDIÇÕES DE PAGAMENTO

2.1. O preço total ajustado para a presente venda é de ${data.valorVeiculo}, a ser pago pelo COMPRADOR nas seguintes condições:

    a) Entrada: ${data.entradaTotal}
    b) Valor da entrada já pago: ${data.entradaPaga}
    c) Valor restante da entrada: ${data.entradaRestante}
    d) Valor financiado: ${data.valorFinanciado || "Não há financiamento"}
    e) Instituição financeira: ${data.bancoFinanciador || "Não aplicável"}

2.2. O COMPRADOR declara ciência de que o não pagamento integral do preço nas condições pactuadas constituirá causa de rescisão do presente contrato.


CLÁUSULA TERCEIRA - DA FORMA DE PAGAMENTO

3.1. A entrada, no valor de ${data.entradaTotal}, foi parcialmente quitada no ato da assinatura deste contrato, no montante de ${data.entradaPaga}.

3.2. O recebimento do valor de entrada pela VENDEDORA está condicionado à compensação dos respectivos valores, quando o pagamento for realizado por meio de cheque, transferência bancária ou qualquer outro meio que não seja dinheiro em espécie.

3.3. A VENDEDORA fornecerá recibo discriminado de todos os valores recebidos.

${financiamentoSection}
${complementoEntradaSection}

CLÁUSULA QUARTA - DA ENTREGA DO VEÍCULO

4.1. O veículo será entregue ao COMPRADOR após a confirmação do recebimento integral da entrada ou, havendo financiamento, após a liberação do crédito pela instituição financeira.

4.2. No ato da entrega, será lavrado Termo de Entrega e Recebimento, assinado por ambas as partes, atestando as condições do veículo e a efetiva tradição do bem.

4.3. A partir da entrega, o COMPRADOR assume todos os riscos relativos ao veículo, incluindo, mas não se limitando a: acidentes, furtos, roubos, avarias, multas de trânsito e demais encargos.


CLÁUSULA QUINTA - DA TRANSFERÊNCIA DE PROPRIEDADE

5.1. A VENDEDORA compromete-se a entregar ao COMPRADOR, no prazo de até 05 (cinco) dias úteis após a quitação integral do preço, todos os documentos necessários à transferência de propriedade do veículo, devidamente preenchidos e assinados, incluindo:

    a) Certificado de Registro do Veículo (CRV) com reconhecimento de firma;
    b) Documento único de transferência (DUT) preenchido;
    c) Comprovante de quitação de débitos até a data da venda.

5.2. As despesas com a transferência de propriedade junto ao DETRAN, incluindo taxas, emolumentos e demais encargos, correrão por conta exclusiva do COMPRADOR.

5.3. O COMPRADOR compromete-se a providenciar a transferência da propriedade do veículo para seu nome no prazo máximo de 30 (trinta) dias contados do recebimento da documentação.


CLÁUSULA SEXTA - DAS GARANTIAS

6.1. A VENDEDORA garante a procedência lícita do veículo, comprometendo-se a responder por quaisquer reclamações de terceiros quanto à propriedade do bem.

6.2. O veículo é vendido no estado em que se encontra, sendo de responsabilidade do COMPRADOR a verificação prévia de todas as suas condições.

6.3. Não estão cobertas por qualquer garantia as peças de desgaste natural, tais como: pneus, pastilhas e lonas de freio, amortecedores, correias, velas, filtros, lâmpadas, bateria, embreagem e similares.


CLÁUSULA SÉTIMA - DAS OBRIGAÇÕES DAS PARTES

7.1. São obrigações da VENDEDORA:

    a) Entregar o veículo em conformidade com o descrito neste contrato;
    b) Fornecer toda a documentação necessária à transferência de propriedade;
    c) Garantir a inexistência de débitos ou gravames sobre o veículo até a data da venda;
    d) Prestar as informações necessárias sobre o veículo e sua documentação.

7.2. São obrigações do COMPRADOR:

    a) Pagar o preço nas condições pactuadas;
    b) Providenciar a transferência de propriedade no prazo estabelecido;
    c) Assumir todos os encargos e responsabilidades sobre o veículo a partir da entrega;
    d) Manter seus dados cadastrais atualizados junto à VENDEDORA.


CLÁUSULA OITAVA - DA RESCISÃO

8.1. O presente contrato poderá ser rescindido nas seguintes hipóteses:

    a) Por acordo mútuo entre as partes;
    b) Por inadimplemento de qualquer obrigação contratual;
    c) Pela não aprovação do financiamento, quando houver;
    d) Por caso fortuito ou força maior que impeça a execução do contrato.

8.2. Em caso de rescisão por culpa do COMPRADOR, aplicar-se-ão as seguintes penalidades:

    a) Perda de 20% (vinte por cento) do valor pago, a título de cláusula penal compensatória;
    b) Retenção dos valores correspondentes a eventuais danos causados ao veículo;
    c) Devolução imediata do veículo, se este já tiver sido entregue.

8.3. Em caso de rescisão por culpa da VENDEDORA, esta deverá restituir integralmente os valores pagos pelo COMPRADOR, acrescidos de correção monetária pelo IGP-M/FGV, no prazo de 15 (quinze) dias.


CLÁUSULA NONA - DA MULTA E JUROS

9.1. O descumprimento de qualquer obrigação pecuniária prevista neste contrato sujeitará a parte inadimplente ao pagamento de:

    a) Multa moratória de ${data.multaPercentual}% (${numberToWords(parseFloat(data.multaPercentual))} por cento) sobre o valor em atraso;
    b) Juros de mora de ${data.jurosMensal}% (${numberToWords(parseFloat(data.jurosMensal))} por cento) ao mês, calculados pro rata die;
    c) Atualização monetária pelo índice IGP-M/FGV ou, na sua falta, pelo IPCA/IBGE.


CLÁUSULA DÉCIMA - DAS DISPOSIÇÕES GERAIS

10.1. As partes elegem a boa-fé como princípio norteador deste contrato, comprometendo-se a resolver amigavelmente eventuais divergências.

10.2. A tolerância de uma parte em relação ao descumprimento de qualquer cláusula pela outra não implicará novação, renúncia ou alteração do pactuado.

10.3. Qualquer alteração deste contrato somente será válida se formalizada por escrito e assinada por ambas as partes.

10.4. Este contrato obriga as partes e seus sucessores a qualquer título.

10.5. As comunicações entre as partes serão realizadas preferencialmente por escrito, através dos endereços e meios de contato informados no preâmbulo deste instrumento.


CLÁUSULA DÉCIMA PRIMEIRA - DO FORO

11.1. Fica eleito o foro da Comarca de ${data.cidadeForo} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.


E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença de duas testemunhas.


${data.cidadeForo}, ${data.dataEmissao}




_____________________________________________
${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
VENDEDORA




_____________________________________________
${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
COMPRADOR(A)




TESTEMUNHAS:


1. _____________________________________________
   Nome:
   CPF:


2. _____________________________________________
   Nome:
   CPF:
`;
}


function numberToWords(num: number): string {
  const units = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte'];
  const tens = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  
  if (num <= 20) return units[Math.floor(num)];
  if (num < 100) {
    const ten = Math.floor(num / 10);
    const unit = num % 10;
    return unit === 0 ? tens[ten] : `${tens[ten]} e ${units[unit]}`;
  }
  return num.toString();
}


function formatPaymentMethod(method: string | null): string {
  const methods: Record<string, string> = {
    pix: "PIX",
    boleto: "Boleto Bancário",
    transferencia: "Transferência Bancária (TED/DOC)",
  };
  return methods[method || ""] || "a definir";
}
