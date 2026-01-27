import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const isDeactivated = `${import.meta.env.VITE_SITE_DEACTIVATE ?? ""}`
	.toLowerCase()
	.trim() === "true";

function MaintenanceScreen() {
	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#0b0c10",
				color: "#e8eaed",
				padding: "2rem",
				textAlign: "center",
				fontFamily: "Inter, system-ui, -apple-system, sans-serif",
			}}
		>
			<div style={{ maxWidth: "640px", lineHeight: 1.6 }}>
				<h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
					Projeto em fase de homologação
				</h1>
				<p style={{ marginBottom: "0.35rem" }}>
					Este ambiente está em processo de validação administrativa.
				</p>
				<p>Em breve estará disponível.</p>
			</div>
		</div>
	);
}

createRoot(document.getElementById("root")!).render(
	isDeactivated ? <MaintenanceScreen /> : <App />,
);
