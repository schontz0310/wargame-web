import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Wargame Web</h1>
          <p className="text-lg text-gray-600">Navegue pelas funcionalidades do sistema</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Minha Coleção */}
          <Link href="/my-collection" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-l-4 border-purple-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-1.586-1.586A2 2 0 0017 5H7a2 2 0 00-1.414.586L4 7m16 0v11a2 2 0 01-2 2H6a2 2 0 01-2-2V7m16 0H4m4 0V4a1 1 0 011-1h6a1 1 0 011 1v3" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                  Minha Coleção
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Gerencie sua coleção pessoal de unidades. Adicione unidades existentes à sua coleção e organize sua biblioteca.
              </p>
              <div className="flex items-center text-purple-600 font-medium">
                <span>Gerenciar Coleção</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          {/* Card Busca de Unidades */}
          <Link href="/search" className="group">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border-l-4 border-green-500">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800 group-hover:text-green-600 transition-colors">
                  Busca de Unidades
                </h2>
              </div>
              <p className="text-gray-600 mb-4">
                Encontre unidades específicas usando filtros avançados por nome, tipo, facção, pontos e outras características.
              </p>
              <div className="flex items-center text-green-600 font-medium">
                <span>Buscar Unidades</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
