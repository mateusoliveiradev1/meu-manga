import type { Metadata } from "next";

const SITE_NAME = process.env.SITE_NAME || "Meu Mangá";

export const metadata: Metadata = {
  title: "Privacidade e termos",
  description: `Política de privacidade e termos de uso do ${SITE_NAME}.`,
};

export default function PrivacidadePage() {
  return (
    <>
      <section className="page-head" aria-label="Privacidade e termos">
        <h1>Privacidade & termos</h1>
        <p className="page-sub">
          O que guardamos, por que guardamos e as regras do {SITE_NAME}. Em português claro, sem juridiquês.
        </p>
      </section>

      <div className="legal">
        <section className="legal-block">
          <h2>O que coletamos</h2>
          <p>
            Apenas o essencial para o site funcionar: nome, e-mail e senha (criptografada) na criação de conta, além do
            progresso e histórico de leitura, favoritas, listas, marcações, notas privadas e publicações que você mesmo
            cria. Nada de rastreadores de terceiros, pixels ou coleta de dados para publicidade.
          </p>
        </section>

        <section className="legal-block">
          <h2>Métricas do próprio site</h2>
          <p>
            Guardamos eventos de uso como abrir uma obra, começar ou concluir um capítulo e favoritar. Eles servem apenas
            para o estúdio entender a experiência de leitura e melhorar as histórias e o produto. Não vendemos esses dados
            nem os enviamos para plataformas de anúncios.
          </p>
        </section>

        <section className="legal-block">
          <h2>Notificações no navegador</h2>
          <p>
            Se você ativar os avisos, guardamos o identificador técnico fornecido pelo navegador para entregar novos
            capítulos e interações da comunidade. A permissão é opcional e pode ser revogada no perfil ou nas configurações
            do próprio navegador.
          </p>
        </section>

        <section className="legal-block">
          <h2>Cookies e sessão</h2>
          <p>
            Usamos cookies apenas para manter você logado. Você pode apagar os dados do navegador a qualquer momento;
            isso desloga a conta, mas não apaga seus dados no servidor.
          </p>
        </section>

        <section className="legal-block">
          <h2>Seus dados, seu controle</h2>
          <p>
            Você pode apagar seus comentários a qualquer momento pelo site. Para apagar a conta ou pedir a exportação dos
            seus dados, fale com o estúdio pelo e-mail de contato — a gente resolve.
          </p>
        </section>

        <section className="legal-block">
          <h2>Conteúdo da comunidade</h2>
          <p>
            Seja gentil. Comentários, teorias e enquetes com spam, assédio ou conteúdo impróprio podem ser removidos pela
            moderação, e contas que insistirem podem ser suspensas. Marque spoilers para preservar a leitura de outras pessoas.
          </p>
        </section>

        <section className="legal-block">
          <h2>Obras publicadas</h2>
          <p>
            Todo o conteúdo publicado no {SITE_NAME} pertence ao estúdio. Não copie, redistribua ou use as obras sem
            autorização. Ler é livre; copiar não é.
          </p>
        </section>

        <section className="legal-block">
          <h2>Contato</h2>
          <p>
            Dúvidas sobre privacidade ou seus dados? Fale com a gente pelo e-mail de contato do estúdio — respondemos
            pessoalmente.
          </p>
        </section>
      </div>
    </>
  );
}
