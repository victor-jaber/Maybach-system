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

  const tradeInSection = data.tradeInPlaca && (data.tradeInValorNumerico > 0 || data.tradeInValor)
    ? `

CLÁUSULA COMPLEMENTAR - DO VEÍCULO DADO EM TROCA

C.1. Como parte do pagamento da entrada, o COMPRADOR entrega à VENDEDORA, em regime de dação em pagamento, o seguinte veículo:

    Marca: ${data.tradeInMarca || '-'}
    Modelo: ${data.tradeInModelo || '-'}
    Ano de Fabricação/Modelo: ${data.tradeInAno || '-'}
    Cor: ${data.tradeInCor || '-'}
    Placa: ${data.tradeInPlaca || '-'}
    Chassi: ${data.tradeInChassi || '-'}
    RENAVAM: ${data.tradeInRenavam || '-'}
    Quilometragem: ${data.tradeInKm || '-'} km

C.2. O valor atribuído ao veículo dado em troca é de ${data.tradeInValor}, que será abatido do preço total do veículo objeto desta transação, compondo parte da entrada.

C.3. O COMPRADOR declara ser o legítimo proprietário do veículo dado em troca, garantindo que o mesmo encontra-se livre e desembaraçado de quaisquer ônus, gravames, débitos de multas, IPVA, licenciamento ou quaisquer outras pendências.

C.4. O COMPRADOR compromete-se a entregar toda a documentação necessária à transferência de propriedade do veículo dado em troca, devidamente preenchida e assinada, no prazo de até 05 (cinco) dias úteis contados da assinatura deste contrato.

${data.tradeInObservacoes ? `C.5. Observações sobre o veículo em troca: ${data.tradeInObservacoes}` : ''}
`
    : '';

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

${data.tradeInPlaca && data.tradeInValor ? `
CLÁUSULA COMPLEMENTAR - DO VEÍCULO DADO EM TROCA

C.1. Como parte do pagamento da entrada, o COMPRADOR entrega à VENDEDORA, em regime de dação em pagamento, o seguinte veículo:

    Marca: ${data.tradeInMarca || '-'}
    Modelo: ${data.tradeInModelo || '-'}
    Ano de Fabricação/Modelo: ${data.tradeInAno || '-'}
    Cor: ${data.tradeInCor || '-'}
    Placa: ${data.tradeInPlaca || '-'}
    Chassi: ${data.tradeInChassi || '-'}
    RENAVAM: ${data.tradeInRenavam || '-'}
    Quilometragem: ${data.tradeInKm || '-'} km

C.2. O valor atribuído ao veículo dado em troca é de ${data.tradeInValor}, que será abatido do preço total do veículo objeto desta transação, compondo parte da entrada.

C.3. O COMPRADOR declara ser o legítimo proprietário do veículo dado em troca, garantindo que o mesmo encontra-se livre e desembaraçado de quaisquer ônus, gravames, débitos de multas, IPVA, licenciamento ou quaisquer outras pendências.

C.4. O COMPRADOR compromete-se a entregar toda a documentação necessária à transferência de propriedade do veículo dado em troca, devidamente preenchida e assinada, no prazo de até 05 (cinco) dias úteis contados da assinatura deste contrato.

${data.tradeInObservacoes ? `C.5. Observações sobre o veículo em troca: ${data.tradeInObservacoes}` : ''}
` : ''}

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

  const tradeInSection = data.tradeInPlaca && (data.tradeInValorNumerico > 0 || data.tradeInValor)
    ? `

CLÁUSULA COMPLEMENTAR - DO VEÍCULO DADO EM TROCA

C.1. Como parte do pagamento da entrada, o COMPRADOR entrega à VENDEDORA, em regime de dação em pagamento, o seguinte veículo:

    Marca: ${data.tradeInMarca || '-'}
    Modelo: ${data.tradeInModelo || '-'}
    Ano de Fabricação/Modelo: ${data.tradeInAno || '-'}
    Cor: ${data.tradeInCor || '-'}
    Placa: ${data.tradeInPlaca || '-'}
    Chassi: ${data.tradeInChassi || '-'}
    RENAVAM: ${data.tradeInRenavam || '-'}
    Quilometragem: ${data.tradeInKm || '-'} km

C.2. O valor atribuído ao veículo dado em troca é de ${data.tradeInValor}, que será abatido do preço total do veículo objeto desta transação, compondo parte da entrada.

C.3. O COMPRADOR declara ser o legítimo proprietário do veículo dado em troca, garantindo que o mesmo encontra-se livre e desembaraçado de quaisquer ônus, gravames, débitos de multas, IPVA, licenciamento ou quaisquer outras pendências.

C.4. O COMPRADOR compromete-se a entregar toda a documentação necessária à transferência de propriedade do veículo dado em troca, devidamente preenchida e assinada, no prazo de até 05 (cinco) dias úteis contados da assinatura deste contrato.

