export type FormaPagamento = "dinheiro" | "pix" | "cartao" | "transferencia" | "boleto" | "outros";

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: "dinheiro", label: "Dinheiro" },
  { value: "pix", label: "Pix" },
  { value: "cartao", label: "Cartão" },
  { value: "transferencia", label: "Transferência" },
  { value: "boleto", label: "Boleto" },
  { value: "outros", label: "Outros" },
];

export type TipoCategoria = "entrada" | "saida";

export const CORES_CATEGORIA = [
  { value: "blue", label: "Azul", class: "bg-blue-500" },
  { value: "green", label: "Verde", class: "bg-green-500" },
  { value: "purple", label: "Roxo", class: "bg-purple-500" },
  { value: "orange", label: "Laranja", class: "bg-orange-500" },
  { value: "red", label: "Vermelho", class: "bg-red-500" },
  { value: "yellow", label: "Amarelo", class: "bg-yellow-500" },
  { value: "pink", label: "Rosa", class: "bg-pink-500" },
  { value: "cyan", label: "Ciano", class: "bg-cyan-500" },
];
