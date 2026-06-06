import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('questions');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !message) {
      alert("Veuillez remplir tous les champs requis.");
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setEmail('');
      setMessage('');
    }, 1200);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', paddingTop: '100px', paddingBottom: '60px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 36px)', fontWeight: 800, color: '#111827', marginBottom: '12px' }}>
            Contactez notre équipe
          </h1>
          <p style={{ fontSize: '15px', color: '#6B7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, fontWeight: 300 }}>
            Une question sur la plateforme, une suggestion, ou un projet de sponsoring ? Remplissez le formulaire ci-dessous et nos administrateurs vous répondront rapidement.
          </p>
        </div>

        {/* Two Columns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
          
          {/* Left: Contact Form Card */}
          <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
            {submitted ? (
              <div style={{ background: '#ECFDF5', border: '1.5px solid #6EE7B7', borderRadius: '12px', padding: '24px', color: '#065F46', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>✓</div>
                <h3 style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>Message Envoyé !</h3>
                <p style={{ fontSize: '13.5px', lineHeight: 1.5, margin: 0 }}>
                  Votre demande de contact a été transmise avec succès aux administrateurs de Kora. Nous reviendrons vers vous dans les plus brefs délais.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  style={{ marginTop: '20px', background: 'none', border: 'none', color: '#047857', fontWeight: 700, fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="email" style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
                    Votre Adresse E-mail *
                  </label>
                  <input 
                    id="email"
                    type="email" 
                    placeholder="votre@email.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="subject" style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
                    Sujet de la demande *
                  </label>
                  <select 
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', background: '#fff', cursor: 'pointer', boxSizing: 'border-box' }}
                  >
                    <option value="sponsoring">Sponsoring / Partenariat publicitaire</option>
                    <option value="questions">Question générale / FAQ</option>
                    <option value="partnership">Partenariat entreprise / Intégration</option>
                    <option value="support">Support technique / Bug report</option>
                    <option value="autre">Autre demande</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="message" style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase' }}>
                    Votre Message *
                  </label>
                  <textarea 
                    id="message"
                    rows={5}
                    placeholder="Comment pouvons-nous vous aider ?" 
                    required 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ width: '100%', border: '1.5px solid #E5E7EB', borderRadius: '10px', padding: '12px 14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting}
                  style={{ background: '#1A5C2E', color: '#fff', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background-color 0.15s' }}
                >
                  <Send size={15} />
                  {submitting ? "Envoi en cours..." : "Envoyer le message"}
                </button>

              </form>
            )}
          </div>

          {/* Right: Info Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ backgroundColor: '#1A5C2E', borderRadius: '16px', padding: '32px', color: '#fff', boxShadow: '0 4px 20px rgba(26,92,46,0.15)' }}>
              <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', letterSpacing: '-0.3px' }}>
                Informations de Contact
              </h3>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#E8F5EE', marginBottom: '24px', fontWeight: 300 }}>
                Vous pouvez également nous contacter directement via nos canaux officiels. Notre équipe support est à votre disposition.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={18} color="#FFF" />
                  <span style={{ fontSize: '14px' }}>contact@kora.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={18} color="#FFF" />
                  <span style={{ fontSize: '14px' }}>+237 677 889 900</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MapPin size={18} color="#FFF" />
                  <span style={{ fontSize: '14px' }}>Yaoundé, Cameroun</span>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', margin: 0 }}>
                💡 FAQ & Support
              </h4>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                Avant d'envoyer un message pour des questions techniques, vous pouvez vérifier vos alertes ou vos insights de marché dans votre tableau de bord.
              </p>
              <button 
                onClick={() => navigate('/')}
                style={{ background: 'none', border: 'none', color: '#1A5C2E', fontWeight: 700, fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0, textDecoration: 'underline' }}
              >
                Retour à l'accueil
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
