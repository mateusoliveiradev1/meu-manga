"use client";

import { useEffect, useState, useTransition } from "react";
import { unsubscribePushAction, updatePushPreferencesAction } from "@/features/push/actions";
import { browserPushSupported, enableBrowserPush } from "@/features/push/client";
import { IconBell, IconCheck } from "@/components/ui/icons";

export function PushSettings({ configured, initialCount, initialChapters, initialSocial }: { configured: boolean; initialCount: number; initialChapters: boolean; initialSocial: boolean }) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [active, setActive] = useState(initialCount > 0);
  const [chapters, setChapters] = useState(initialChapters);
  const [social, setSocial] = useState(initialSocial);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => { setSupported(browserPushSupported()); }, []);

  async function enable() {
    setMessage("");
    try {
      const result = await enableBrowserPush();
      if (!result.ok) return setMessage(result.error);
      setActive(true); setMessage("Avisos ativados neste aparelho.");
    } catch { setMessage("Não foi possível ativar os avisos neste navegador."); }
  }

  async function disable() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) { await unsubscribePushAction(subscription.endpoint); await subscription.unsubscribe(); }
    setActive(false); setMessage("Avisos desativados neste aparelho.");
  }

  function update(nextChapters: boolean, nextSocial: boolean) {
    setChapters(nextChapters); setSocial(nextSocial);
    startTransition(async () => { await updatePushPreferencesAction({ chapters: nextChapters, social: nextSocial }); setMessage("Preferências salvas."); });
  }

  return <section id="avisos" className="manga-panel push-settings" aria-labelledby="push-title"><div className="push-settings-intro"><IconBell size={23} /><div><h2 id="push-title">Avisos no navegador</h2><p>Receba novidades mesmo quando a estante estiver fechada. Cada aparelho é ativado separadamente.</p></div>{active && <span><IconCheck size={14} /> ativo</span>}</div>{!configured ? <p className="muted">Os avisos serão liberados quando as chaves seguras do servidor estiverem configuradas.</p> : supported === false ? <p className="muted">Este navegador não oferece notificações push.</p> : <><div className="push-actions"><button type="button" className={active ? "btn ghost" : "btn"} disabled={pending || supported == null} onClick={active ? disable : enable}>{active ? "Desativar neste aparelho" : "Ativar neste aparelho"}</button></div><div className="push-preferences"><label><input type="checkbox" checked={chapters} onChange={(event) => update(event.target.checked, social)} /><span><strong>Novos capítulos</strong><small>Obras que você favoritou.</small></span></label><label><input type="checkbox" checked={social} onChange={(event) => update(chapters, event.target.checked)} /><span><strong>Conversas</strong><small>Respostas, curtidas, seguidores e destaques.</small></span></label></div></>}{message && <p className="push-message" role="status">{message}</p>}</section>;
}
