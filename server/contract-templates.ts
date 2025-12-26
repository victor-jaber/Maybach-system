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
  
  valorMinimoVenda?: string;
  comissaoLoja?: string;
  prazoConsignacao?: number;
  multaRetiradaAntecipada?: string;
  
  dataHoraEntrega?: string;
  chavePrincipal?: boolean;
  chaveReserva?: boolean;
  manual?: boolean;
  condicaoGeral?: string;
  
  dataHoraRetirada?: string;
  motivoRetirada?: string;
  condicaoVeiculo?: string;
  
  tradeInMarca?: string;
  tradeInModelo?: string;
  tradeInAno?: string;
  tradeInCor?: string;
  tradeInPlaca?: string;
  tradeInChassi?: string;
  tradeInRenavam?: string;
  tradeInKm?: string;
  tradeInValor?: string;
  tradeInObservacoes?: string;
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

  const tradeInSection = data.tradeInPlaca && data.tradeInValor
    ? `

CLÁUSULA COMPLEMENTAR - DO VEÍCULO DADO EM TROCA

C.1. Como parte do pagamento, o COMPRADOR entrega à VENDEDORA, em regime de dação em pagamento, o seguinte veículo:

    Marca: ${data.tradeInMarca || '-'}
    Modelo: ${data.tradeInModelo || '-'}
    Ano de Fabricação/Modelo: ${data.tradeInAno || '-'}
    Cor: ${data.tradeInCor || '-'}
    Placa: ${data.tradeInPlaca || '-'}
    Chassi: ${data.tradeInChassi || '-'}
    RENAVAM: ${data.tradeInRenavam || '-'}
    Quilometragem: ${data.tradeInKm || '-'} km

C.2. O valor atribuído ao veículo dado em troca é de ${data.tradeInValor}, que será abatido do preço total do veículo objeto desta compra e venda.

C.3. O COMPRADOR declara ser o legítimo proprietário do veículo dado em troca, garantindo que o mesmo encontra-se livre e desembaraçado de quaisquer ônus, gravames, débitos de multas, IPVA, licenciamento ou quaisquer outras pendências.

C.4. O COMPRADOR compromete-se a entregar toda a documentação necessária à transferência de propriedade do veículo dado em troca, devidamente preenchida e assinada, no prazo de até 05 (cinco) dias úteis contados da assinatura deste contrato.

C.5. Caso sejam constatados débitos, multas, gravames ou quaisquer ônus sobre o veículo dado em troca não declarados pelo COMPRADOR, este se obriga a quitá-los imediatamente ou autoriza a VENDEDORA a descontá-los do valor atribuído ao veículo em troca.

${data.tradeInObservacoes ? `C.6. Observações sobre o veículo em troca: ${data.tradeInObservacoes}` : ''}
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
${tradeInSection}

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


// ==================== CONTRATO DE COMPRA DE VEÍCULO (LOJA COMPRANDO) ====================
export function getVehiclePurchaseContract(data: ContractData): string {
  return `
CONTRATO PARTICULAR DE COMPRA E VENDA DE VEÍCULO AUTOMOTOR
(Aquisição de Veículo pela Concessionária)

Pelo presente instrumento particular de compra e venda de veículo automotor, firmado de comum acordo entre as partes abaixo qualificadas, regendo-se pelas cláusulas e condições seguintes e pelas disposições do Código Civil Brasileiro:

COMPRADORA: ${data.razaoSocialLoja}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.cnpjLoja}, com sede na ${data.enderecoLoja}, neste ato representada por seu(sua) representante legal ${data.representanteLoja}, inscrito(a) no CPF sob o nº ${data.cpfRepresentanteLoja}, telefone ${data.telefoneLoja}, doravante denominada simplesmente "COMPRADORA";

VENDEDOR(A): ${data.nomeCliente}, inscrito(a) no ${data.tipoDocumentoCliente} sob o nº ${data.cpfCnpjCliente}, ${data.tipoDocumentoCliente === "CPF" ? `portador(a) do RG nº ${data.rgCliente}, CNH nº ${data.cnhCliente}, ` : ""}residente e domiciliado(a) na ${data.enderecoCliente}, telefone ${data.telefoneCliente}, e-mail ${data.emailCliente}, doravante denominado(a) simplesmente "VENDEDOR(A)";


CLÁUSULA PRIMEIRA - DO OBJETO

1.1. O(A) VENDEDOR(A), na qualidade de legítimo(a) proprietário(a) e possuidor(a), vende e transfere à COMPRADORA, que aceita e adquire, o veículo automotor abaixo descrito e caracterizado:

    Marca/Modelo: ${data.marca} ${data.modelo}
    Ano de Fabricação/Modelo: ${data.ano}
    Cor: ${data.cor}
    Placa: ${data.placa}
    Chassi: ${data.chassi}
    RENAVAM: ${data.renavam}
    Quilometragem atual: ${data.km} km
    Combustível: Conforme documento do veículo

1.2. O(A) VENDEDOR(A) declara, sob as penas da lei, que o veículo objeto deste contrato:

    a) É de sua exclusiva e legítima propriedade;
    b) Encontra-se livre e desembaraçado de quaisquer ônus, gravames, alienações fiduciárias, penhoras, arrestos, sequestros ou quaisquer outros impedimentos legais;
    c) Não está envolvido em sinistros, acidentes graves, furto, roubo ou fraude;
    d) Possui procedência lícita e documentação regular.


CLÁUSULA SEGUNDA - DO PREÇO E FORMA DE PAGAMENTO

2.1. O preço total e certo ajustado para a presente compra e venda é de ${data.valorVeiculo} (${numberToWords(parseFloat(data.valorVeiculo?.replace(/\D/g, '') || '0') / 100)} reais).

2.2. O pagamento será realizado pela COMPRADORA nas seguintes condições:

    Valor Total: ${data.valorVeiculo}
    Forma de Pagamento: ${data.formaPagamento === "avista" ? "À vista, mediante transferência bancária (PIX ou TED)" : `Parcelado em ${data.quantidadeParcelas} parcelas de ${data.valorParcela}`}
    ${data.formaPagamento === "avista" ? `Data do Pagamento: ${data.dataVencimentoAvista}` : `Primeiro vencimento: 30 dias após a assinatura deste contrato`}

2.3. O pagamento será efetuado mediante apresentação de todos os documentos do veículo e assinatura do presente contrato.

2.4. A COMPRADORA emitirá recibo discriminado de todos os valores pagos ao(à) VENDEDOR(A).


CLÁUSULA TERCEIRA - DA TRANSFERÊNCIA DE PROPRIEDADE

3.1. O(A) VENDEDOR(A) compromete-se a entregar à COMPRADORA, no ato da assinatura deste contrato, todos os documentos necessários à transferência de propriedade do veículo, incluindo:

    a) Certificado de Registro do Veículo (CRV) devidamente preenchido e com firma reconhecida;
    b) Documento único de transferência (DUT);
    c) Comprovante de quitação de débitos até a data desta venda;
    d) Cópia dos documentos pessoais (RG, CPF e comprovante de residência).

3.2. As despesas com a transferência de propriedade do veículo para o nome da COMPRADORA correrão por conta exclusiva desta.


CLÁUSULA QUARTA - DA RESPONSABILIDADE POR MULTAS, TRIBUTOS E ENCARGOS

4.1. O(A) VENDEDOR(A) é integralmente responsável por todas as multas de trânsito, infrações, tributos (IPVA, DPVAT/Seguro Obrigatório), taxas de licenciamento, pedágios não pagos e quaisquer outros encargos ou penalidades incidentes sobre o veículo, cujos fatos geradores tenham ocorrido até a data de ${data.dataEmissao} (data da entrega do veículo).

4.2. O(A) VENDEDOR(A) compromete-se a quitar integralmente todos os débitos pendentes relativos ao veículo antes ou no ato da entrega, apresentando comprovantes de quitação à COMPRADORA.

4.3. Caso seja constatada a existência de débitos anteriores à data da entrega após a efetivação da compra, o(a) VENDEDOR(A) obriga-se a quitá-los no prazo de 05 (cinco) dias úteis após notificação, sob pena de:

    a) Desconto do valor devido na parcela vincenda, se houver;
    b) Cobrança judicial, acrescida de multa de 10% (dez por cento) sobre o valor devido;
    c) Responsabilização por perdas e danos.

4.4. A COMPRADORA será responsável por todas as multas, tributos e encargos cujos fatos geradores ocorrerem a partir da data da entrega do veículo.


CLÁUSULA QUINTA - DA ENTREGA DO VEÍCULO

5.1. O veículo será entregue à COMPRADORA nas dependências da loja, na data da assinatura deste contrato ou em data a ser acordada entre as partes.

5.2. No ato da entrega, será lavrado PROTOCOLO DE ENTREGA DE VEÍCULO, documento complementar a este contrato, no qual constará:

    a) Data e hora da efetiva entrega;
    b) Condições gerais do veículo no momento da entrega;
    c) Checklist de itens entregues (chaves, manuais, acessórios);
    d) Assinatura de ambas as partes.

5.3. A partir da assinatura do Protocolo de Entrega, a posse e os riscos sobre o veículo transferem-se integralmente para a COMPRADORA.


CLÁUSULA SEXTA - DAS DECLARAÇÕES E GARANTIAS DO(A) VENDEDOR(A)

6.1. O(A) VENDEDOR(A) declara e garante que:

    a) É o(a) único(a) e legítimo(a) proprietário(a) do veículo;
    b) O veículo não está penhorado, arrestado, sequestrado ou envolvido em qualquer litígio judicial;
    c) Não existem contratos de financiamento, arrendamento mercantil (leasing) ou consórcio pendentes sobre o veículo;
    d) O veículo não possui adulteração de chassi, motor ou qualquer componente original;
    e) Todas as informações prestadas neste contrato são verdadeiras e completas.

6.2. O(A) VENDEDOR(A) responderá civil e criminalmente pela veracidade das declarações prestadas, ficando obrigado(a) a indenizar a COMPRADORA por quaisquer prejuízos decorrentes de informações falsas ou omissões.


CLÁUSULA SÉTIMA - DA RESCISÃO

7.1. O presente contrato poderá ser rescindido nas seguintes hipóteses:

    a) Por acordo mútuo entre as partes;
    b) Por inadimplemento de qualquer obrigação contratual;
    c) Pela constatação de vícios ocultos ou defeitos não informados pelo(a) VENDEDOR(A);
    d) Pela constatação de falsidade nas declarações do(a) VENDEDOR(A).

7.2. Em caso de rescisão por culpa do(a) VENDEDOR(A), este(a) deverá restituir integralmente os valores recebidos, acrescidos de correção monetária pelo IGP-M/FGV e multa de 10% (dez por cento), no prazo de 05 (cinco) dias úteis.


CLÁUSULA OITAVA - DAS DISPOSIÇÕES GERAIS

8.1. O presente contrato obriga as partes contratantes e seus sucessores a qualquer título.

8.2. A tolerância de qualquer das partes quanto ao descumprimento de obrigações pela outra não implicará novação, renúncia ou alteração das condições pactuadas.

8.3. Qualquer alteração deste contrato somente terá validade se formalizada por escrito e assinada por ambas as partes.

8.4. As partes declaram ter lido e compreendido integralmente todas as cláusulas deste contrato, aceitando-as de livre e espontânea vontade.


CLÁUSULA NONA - DO FORO

9.1. Fica eleito o foro da Comarca de ${data.cidadeForo}, Estado de ${data.cidadeForo === "São Paulo" ? "São Paulo" : "correspondente"}, para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.


E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença de duas testemunhas abaixo assinadas, para que produza seus jurídicos e legais efeitos.


${data.cidadeForo}, ${data.dataEmissao}




_____________________________________________
${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
COMPRADORA




_____________________________________________
${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
VENDEDOR(A)




TESTEMUNHAS:


1. _____________________________________________
   Nome:
   CPF:


2. _____________________________________________
   Nome:
   CPF:
`;
}


// ==================== CONTRATO DE CONSIGNAÇÃO DE VEÍCULO ====================
export function getConsignmentContract(data: ContractData): string {
  return `
CONTRATO PARTICULAR DE CONSIGNAÇÃO DE VEÍCULO AUTOMOTOR

Pelo presente instrumento particular de consignação de veículo automotor, firmado de comum acordo entre as partes abaixo qualificadas, regendo-se pelas cláusulas e condições seguintes e pelas disposições do Código Civil Brasileiro:

CONSIGNATÁRIA: ${data.razaoSocialLoja}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${data.cnpjLoja}, com sede na ${data.enderecoLoja}, neste ato representada por seu(sua) representante legal ${data.representanteLoja}, inscrito(a) no CPF sob o nº ${data.cpfRepresentanteLoja}, telefone ${data.telefoneLoja}, doravante denominada simplesmente "CONSIGNATÁRIA" ou "LOJA";

CONSIGNANTE: ${data.nomeCliente}, inscrito(a) no ${data.tipoDocumentoCliente} sob o nº ${data.cpfCnpjCliente}, ${data.tipoDocumentoCliente === "CPF" ? `portador(a) do RG nº ${data.rgCliente}, CNH nº ${data.cnhCliente}, ` : ""}residente e domiciliado(a) na ${data.enderecoCliente}, telefone ${data.telefoneCliente}, e-mail ${data.emailCliente}, doravante denominado(a) simplesmente "CONSIGNANTE" ou "PROPRIETÁRIO(A)";


CLÁUSULA PRIMEIRA - DO OBJETO

1.1. O presente contrato tem por objeto a consignação do veículo automotor abaixo descrito e caracterizado, de propriedade do(a) CONSIGNANTE, para exposição e venda pela CONSIGNATÁRIA:

    Marca/Modelo: ${data.marca} ${data.modelo}
    Ano de Fabricação/Modelo: ${data.ano}
    Cor: ${data.cor}
    Placa: ${data.placa}
    Chassi: ${data.chassi}
    RENAVAM: ${data.renavam}
    Quilometragem atual: ${data.km} km
    Combustível: Conforme documento do veículo

1.2. O(A) CONSIGNANTE declara ser o(a) legítimo(a) proprietário(a) do veículo, que se encontra livre e desembaraçado de quaisquer ônus, gravames, alienações fiduciárias ou impedimentos legais.

1.3. O veículo somente será aceito em consignação após cadastro completo no sistema da CONSIGNATÁRIA e inclusão formal no estoque da loja.


CLÁUSULA SEGUNDA - DO VALOR MÍNIMO DE VENDA

2.1. O valor mínimo de venda do veículo fica estabelecido em ${data.valorMinimoVenda || data.valorVeiculo} (${numberToWords(parseFloat((data.valorMinimoVenda || data.valorVeiculo)?.replace(/\D/g, '') || '0') / 100)} reais).

2.2. A CONSIGNATÁRIA poderá negociar valores superiores ao mínimo estabelecido, revertendo o excedente em favor do(a) CONSIGNANTE, após dedução da comissão.

2.3. Qualquer venda por valor inferior ao mínimo estabelecido deverá ser previamente autorizada, por escrito, pelo(a) CONSIGNANTE.


CLÁUSULA TERCEIRA - DA COMISSÃO

3.1. Pela intermediação da venda, a CONSIGNATÁRIA fará jus à comissão de ${data.comissaoLoja || "10%"} (${numberToWords(parseFloat((data.comissaoLoja || "10")?.replace(/\D/g, '') || '10'))} por cento) sobre o valor efetivo da venda.

3.2. A comissão será descontada do valor da venda no momento do repasse ao(à) CONSIGNANTE.

3.3. A comissão remunera todos os serviços prestados pela CONSIGNATÁRIA, incluindo:

    a) Exposição do veículo em suas dependências;
    b) Divulgação e publicidade;
    c) Atendimento a interessados;
    d) Intermediação da negociação;
    e) Assessoria na documentação de transferência.


CLÁUSULA QUARTA - DO PRAZO

4.1. O prazo de consignação é de ${data.prazoConsignacao || 60} (${numberToWords(data.prazoConsignacao || 60)}) dias corridos, contados a partir da data de assinatura deste contrato.

4.2. Findo o prazo sem que haja venda, o contrato poderá ser:

    a) Prorrogado por igual período, mediante acordo entre as partes;
    b) Encerrado, com a devolução do veículo ao(à) CONSIGNANTE.

4.3. A prorrogação deverá ser formalizada por escrito, mediante aditivo contratual.


CLÁUSULA QUINTA - DAS OBRIGAÇÕES DA CONSIGNATÁRIA

5.1. A CONSIGNATÁRIA obriga-se a:

    a) Manter o veículo em local coberto e seguro, em suas dependências;
    b) Zelar pela conservação e integridade do veículo durante o período de consignação;
    c) Expor o veículo em condições adequadas de apresentação;
    d) Promover a divulgação e publicidade do veículo;
    e) Informar ao(à) CONSIGNANTE sobre o andamento das negociações, quando solicitado;
    f) Não utilizar o veículo para test-drives sem autorização prévia do(a) CONSIGNANTE;
    g) Comunicar imediatamente ao(à) CONSIGNANTE sobre a venda do veículo;
    h) Repassar o valor da venda ao(à) CONSIGNANTE no prazo de 05 (cinco) dias úteis após o recebimento integral.

5.2. A CONSIGNATÁRIA não se responsabiliza por danos decorrentes de eventos de força maior ou caso fortuito, tais como enchentes, incêndios, furtos ou roubos ocorridos em suas dependências.


CLÁUSULA SEXTA - DAS OBRIGAÇÕES DO(A) CONSIGNANTE

6.1. O(A) CONSIGNANTE obriga-se a:

    a) Entregar o veículo em perfeitas condições de funcionamento e apresentação;
    b) Fornecer todos os documentos do veículo (CRV, CRLV, manual, chaves);
    c) Manter em dia todos os tributos, taxas e encargos incidentes sobre o veículo durante a consignação;
    d) Comunicar imediatamente à CONSIGNATÁRIA sobre qualquer alteração na situação jurídica do veículo;
    e) Providenciar toda a documentação necessária para a transferência, quando da venda;
    f) Não negociar ou anunciar o veículo por conta própria durante a vigência deste contrato.


CLÁUSULA SÉTIMA - DA RESPONSABILIDADE POR MULTAS E ENCARGOS

7.1. O(A) CONSIGNANTE é integralmente responsável por todas as multas de trânsito, infrações, tributos (IPVA, DPVAT), taxas de licenciamento e quaisquer outros encargos ou penalidades incidentes sobre o veículo, cujos fatos geradores tenham ocorrido até a data de entrega do veículo à CONSIGNATÁRIA.

7.2. Durante o período de consignação, permanecendo o veículo nas dependências da CONSIGNATÁRIA, esta será responsável apenas por danos decorrentes de sua culpa comprovada.

7.3. Após a retirada do veículo pelo(a) CONSIGNANTE ou venda a terceiros, todas as multas, tributos e encargos passarão a ser de responsabilidade de quem estiver na posse do veículo.


CLÁUSULA OITAVA - DA RETIRADA ANTECIPADA

8.1. O(A) CONSIGNANTE poderá retirar o veículo antes do término do prazo de consignação, mediante comunicação prévia de 03 (três) dias úteis.

8.2. Em caso de retirada antecipada antes de decorridos 30 (trinta) dias da consignação, o(a) CONSIGNANTE pagará à CONSIGNATÁRIA multa compensatória no valor de ${data.multaRetiradaAntecipada || "R$ 500,00"} (${numberToWords(parseFloat((data.multaRetiradaAntecipada || "500")?.replace(/\D/g, '') || '500'))} reais), a título de ressarcimento pelos custos de exposição e divulgação.

8.3. A multa não será devida se a retirada decorrer de:

    a) Descumprimento contratual pela CONSIGNATÁRIA;
    b) Acordo entre as partes;
    c) Motivo de força maior devidamente comprovado.


CLÁUSULA NONA - DO PROTOCOLO DE RETIRADA

9.1. Ao encerramento da consignação, seja por venda, término do prazo ou retirada antecipada, será lavrado PROTOCOLO DE RETIRADA DE VEÍCULO CONSIGNADO, documento complementar a este contrato.

9.2. O Protocolo de Retirada conterá:

    a) Data e hora da retirada;
    b) Condições do veículo no momento da devolução;
    c) Declaração de encerramento da consignação;
    d) Assinatura de ambas as partes.


CLÁUSULA DÉCIMA - DA RESCISÃO

10.1. O presente contrato poderá ser rescindido nas seguintes hipóteses:

    a) Pela venda do veículo;
    b) Pelo término do prazo sem prorrogação;
    c) Por acordo mútuo entre as partes;
    d) Por inadimplemento de qualquer obrigação contratual;
    e) Pela constatação de irregularidades na documentação ou propriedade do veículo.

10.2. Em caso de rescisão por culpa do(a) CONSIGNANTE, este(a) pagará à CONSIGNATÁRIA a multa prevista na Cláusula Oitava.

10.3. Em caso de rescisão por culpa da CONSIGNATÁRIA, esta deverá devolver o veículo nas mesmas condições em que o recebeu, ressalvado o desgaste natural.


CLÁUSULA DÉCIMA PRIMEIRA - DAS DISPOSIÇÕES GERAIS

11.1. Este contrato não constitui vínculo empregatício entre as partes.

11.2. A CONSIGNATÁRIA age como mera intermediária na venda, não assumindo a propriedade do veículo consignado.

11.3. As partes declaram ter lido e compreendido integralmente todas as cláusulas deste contrato.


CLÁUSULA DÉCIMA SEGUNDA - DO FORO

12.1. Fica eleito o foro da Comarca de ${data.cidadeForo} para dirimir quaisquer dúvidas ou litígios decorrentes deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.


E, por estarem assim justas e contratadas, as partes firmam o presente instrumento em 02 (duas) vias de igual teor e forma, na presença de duas testemunhas.


${data.cidadeForo}, ${data.dataEmissao}




_____________________________________________
${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
CONSIGNATÁRIA




_____________________________________________
${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
CONSIGNANTE




TESTEMUNHAS:


1. _____________________________________________
   Nome:
   CPF:


2. _____________________________________________
   Nome:
   CPF:
`;
}


// ==================== PROTOCOLO DE ENTREGA DE VEÍCULO ====================
export function getDeliveryProtocol(data: ContractData): string {
  const dataHora = data.dataHoraEntrega || new Date().toLocaleString("pt-BR");
  
  return `
PROTOCOLO DE ENTREGA DE VEÍCULO

IDENTIFICAÇÃO DAS PARTES

ENTREGANTE: ${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
Endereço: ${data.enderecoCliente}
Telefone: ${data.telefoneCliente}

RECEBEDOR: ${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
Endereço: ${data.enderecoLoja}
Representante: ${data.representanteLoja}
CPF do Representante: ${data.cpfRepresentanteLoja}


IDENTIFICAÇÃO DO VEÍCULO

Marca/Modelo: ${data.marca} ${data.modelo}
Ano de Fabricação/Modelo: ${data.ano}
Cor: ${data.cor}
Placa: ${data.placa}
Chassi: ${data.chassi}
RENAVAM: ${data.renavam}
Quilometragem: ${data.km} km


DATA E HORA DA ENTREGA

Data: ${dataHora.split(",")[0] || data.dataEmissao}
Hora: ${dataHora.split(",")[1]?.trim() || "___:___"}


CHECKLIST DE ENTREGA

[ ${data.chavePrincipal !== false ? "X" : " "} ] Chave Principal
[ ${data.chaveReserva ? "X" : " "} ] Chave Reserva
[ ${data.manual ? "X" : " "} ] Manual do Proprietário
[ ] Certificado de Registro do Veículo (CRV)
[ ] Certificado de Registro e Licenciamento do Veículo (CRLV)
[ ] Triângulo de Segurança
[ ] Macaco
[ ] Chave de Roda
[ ] Estepe

Outros itens entregues: _______________________________________________


CONDIÇÃO GERAL DO VEÍCULO

${data.condicaoGeral || "[ ] Excelente   [ ] Boa   [ ] Regular   [ ] Necessita reparos"}

Observações sobre o estado do veículo:
_______________________________________________________________________
_______________________________________________________________________
_______________________________________________________________________


DECLARAÇÃO

Por meio deste protocolo, declaro que estou entregando/recebendo o veículo acima identificado nas condições descritas.

DECLARO ESTAR CIENTE de que, a partir desta data e hora (${dataHora}), TODAS AS MULTAS DE TRÂNSITO, TRIBUTOS (IPVA, DPVAT/SEGURO OBRIGATÓRIO), TAXAS DE LICENCIAMENTO, PEDÁGIOS E QUAISQUER OUTRAS RESPONSABILIDADES incidentes sobre o veículo passam a ser de integral responsabilidade do RECEBEDOR.

O ENTREGANTE é responsável por todos os débitos e infrações cujos fatos geradores tenham ocorrido até a presente data e hora.


ASSINATURAS


${data.cidadeForo}, ${data.dataEmissao}




_____________________________________________
ENTREGANTE
Nome: ${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}




_____________________________________________
RECEBEDOR
${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
Representante: ${data.representanteLoja}
`;
}


// ==================== PROTOCOLO DE RETIRADA DE VEÍCULO CONSIGNADO ====================
export function getConsignmentWithdrawalProtocol(data: ContractData): string {
  const dataHora = data.dataHoraRetirada || new Date().toLocaleString("pt-BR");
  
  return `
PROTOCOLO DE RETIRADA DE VEÍCULO CONSIGNADO

IDENTIFICAÇÃO DAS PARTES

CONSIGNATÁRIA (Que está devolvendo): ${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
Endereço: ${data.enderecoLoja}
Representante: ${data.representanteLoja}
CPF do Representante: ${data.cpfRepresentanteLoja}

CONSIGNANTE/PROPRIETÁRIO(A) (Que está retirando): ${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
Endereço: ${data.enderecoCliente}
Telefone: ${data.telefoneCliente}


IDENTIFICAÇÃO DO VEÍCULO

Marca/Modelo: ${data.marca} ${data.modelo}
Ano de Fabricação/Modelo: ${data.ano}
Cor: ${data.cor}
Placa: ${data.placa}
Chassi: ${data.chassi}
RENAVAM: ${data.renavam}
Quilometragem: ${data.km} km


DATA E HORA DA RETIRADA

Data: ${dataHora.split(",")[0] || data.dataEmissao}
Hora: ${dataHora.split(",")[1]?.trim() || "___:___"}


MOTIVO DA RETIRADA

[ ] Término do prazo de consignação sem venda
[ ] Retirada antecipada a pedido do proprietário
[ ] Acordo entre as partes
[ ] Outro: ${data.motivoRetirada || "_______________________________________"}


CONDIÇÃO DO VEÍCULO NA RETIRADA

O veículo encontra-se em: ${data.condicaoVeiculo || "[ ] Mesmas condições da entrega   [ ] Com alterações (descrever abaixo)"}

Observações sobre o estado do veículo:
_______________________________________________________________________
_______________________________________________________________________


ITENS DEVOLVIDOS

[ ] Chave Principal
[ ] Chave Reserva (se foi entregue)
[ ] Manual do Proprietário (se foi entregue)
[ ] CRV (Certificado de Registro do Veículo)
[ ] CRLV (Certificado de Registro e Licenciamento)
[ ] Demais acessórios/documentos conforme protocolo de entrega


DECLARAÇÃO DE ENCERRAMENTO DA CONSIGNAÇÃO

Por meio deste protocolo, as partes declaram que:

1. O CONTRATO DE CONSIGNAÇÃO firmado entre as partes fica ENCERRADO a partir desta data.

2. O veículo foi devolvido ao(à) PROPRIETÁRIO(A)/CONSIGNANTE nas condições acima descritas.

3. Não há pendências financeiras entre as partes relativas ao contrato de consignação.
   (Se houver pendências, descrever): _______________________________________

4. A partir desta data e hora (${dataHora}), TODAS AS MULTAS DE TRÂNSITO, TRIBUTOS (IPVA, DPVAT/SEGURO OBRIGATÓRIO), TAXAS DE LICENCIAMENTO e QUAISQUER OUTRAS RESPONSABILIDADES incidentes sobre o veículo passam a ser de integral responsabilidade do(a) PROPRIETÁRIO(A)/CONSIGNANTE que retira o veículo.


ASSINATURAS


${data.cidadeForo}, ${data.dataEmissao}




_____________________________________________
CONSIGNATÁRIA (Que está devolvendo)
${data.razaoSocialLoja}
CNPJ: ${data.cnpjLoja}
Representante: ${data.representanteLoja}




_____________________________________________
CONSIGNANTE/PROPRIETÁRIO(A) (Que está retirando)
Nome: ${data.nomeCliente}
${data.tipoDocumentoCliente}: ${data.cpfCnpjCliente}
`;
}
