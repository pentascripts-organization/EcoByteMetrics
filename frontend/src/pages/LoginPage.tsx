import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowUpRight, Eye, EyeOff, Leaf, LockKeyhole, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Brand } from '../components/Brand';
import { LeafScene } from '../components/LeafScene';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.currentTarget.reset();
    setMessage('O acesso estará disponível quando a autenticação for conectada. Por enquanto, explore o dashboard livremente.');
  };
  return <div className="login-page"><div className="landscape-background" /><div className="login-overlay" /><LeafScene /><header className="login-header"><Brand /><Link className="text-link" to="/"><ArrowLeft size={16} />Voltar ao início</Link></header>
    <main className="login-content"><div className="login-intro"><span className="pill-label"><Leaf size={15} />UM NOVO OLHAR PARA SEU SOFTWARE</span><h1>Boas escolhas<br />começam com<br /><span>clareza.</span></h1><p>Uma visão mais consciente da energia<br />e do impacto das suas aplicações.</p></div><section className="login-card"><span className="icon-tile"><LockKeyhole size={24} /></span><span className="eyebrow">BEM-VINDO AO ECOBYTEMETRICS</span><h2>Seu próximo passo.</h2><p>Acesse a área de configuração do seu ambiente.</p><form onSubmit={submit}><label htmlFor="email">E-mail</label><div className="input-with-icon"><Mail size={18} /><input id="email" type="email" autoComplete="username" placeholder="voce@exemplo.com" required /></div><label htmlFor="password">Senha</label><div className="input-with-icon"><LockKeyhole size={18} /><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" required minLength={1} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p className="login-availability">Autenticação em breve. Nenhuma credencial é enviada ou armazenada.</p><button className="button button-dark" type="submit">Entrar<ArrowUpRight size={18} /></button>{message && <p className="form-message" role="status">{message}</p>}</form><div className="login-divider"><span>ou conheça primeiro</span></div><Link className="button button-outline" to="/dashboard">Explorar o dashboard<ArrowUpRight size={17} /></Link></section></main><footer className="login-footer"><Leaf size={15} />Cada byte conta. Cada escolha também.</footer>
  </div>;
}
