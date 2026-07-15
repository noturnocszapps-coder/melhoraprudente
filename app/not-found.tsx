import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-9xl font-black text-red-600 tracking-tighter">404</h1>
      <h2 className="text-2xl font-bold uppercase tracking-tight mt-4 text-zinc-900">
        Página Não Encontrada
      </h2>
      <p className="text-zinc-500 mt-2 max-w-md">
        Desculpe, o conteúdo que você está procurando não existe ou foi movido para outro endereço.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-xl text-xs uppercase tracking-widest hover:bg-red-700 transition-colors shadow-sm"
      >
        Voltar para a Home
      </Link>
    </div>
  );
}
