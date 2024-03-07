import SelectFunction from "@/components/SelectFunction";

export default function Home() {
  return (
    <main className="vh-100 d-flex flex-column justify-content-center align-items-center">
      <h1 className="display-1">FileFlow</h1>
      <h2 className="fs-5 mb-5">Compartilhamento de Arquivos em Tempo Real</h2>
      <SelectFunction />
    </main>
  );
}
