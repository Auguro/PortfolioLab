interface Props {
  painelAberto: boolean;
  setPainelAberto: (valor: boolean) => void;
}

export default function Cabecalho({ painelAberto, setPainelAberto }: Props) {
  return (
    <header style={{ 
      background: "var(--fundo-card)", 
      borderBottom: "1px solid var(--borda)",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <div>
        <h1 style={{ color: "var(--verde)", fontSize: "18px", fontWeight: "bold" }}>
          Paridade de Risco
        </h1>
        <p style={{ color: "var(--texto-suave)", fontSize: "12px" }}>
          Mercado brasileiro · B3
        </p>
      </div>

      <button
        onClick={() => setPainelAberto(!painelAberto)}
        style={{
          background: "none",
          border: "1px solid var(--borda)",
          borderRadius: "6px",
          padding: "8px",
          cursor: "pointer",
          color: "var(--texto)",
          fontSize: "18px"
        }}
      >
        ☰
      </button>
    </header>
  );
}