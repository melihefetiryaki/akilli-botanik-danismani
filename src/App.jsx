import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './App.css';





gsap.registerPlugin(ScrollTrigger);

const plantData = {
  "gul": {
    name: "Gül", category: "Süs Bitkisi", endemic: false,
    moisture: "40 - 60", ph: "6.0 - 6.5",
    light: "Tam güneş (6-8 saat)", npk: "5-10-5 (Fosfor ağırlıklı)",
    warnings: "Yapraklar ıslak kalmamalı, aksi takdirde kara leke gibi mantar hastalıklarına yakalanır."
  },
  "menekse": {
    name: "Afrika Menekşesi", category: "Ev Bitkisi", endemic: false,
    moisture: "50 - 70", ph: "5.8 - 6.2",
    light: "Filtrelenmiş ışık", npk: "14-36-14 (Sıvı gübre)",
    warnings: "Yapraklarına kesinlikle su değmemelidir. Saksı altlığından sulama tercih edilmelidir."
  },
  "domates": {
    name: "Domates", category: "Tarım Ürünü", endemic: false,
    moisture: "60 - 80", ph: "6.0 - 6.8",
    light: "Tam güneş (8+ saat)", npk: "5-10-10 (Meyve tutumu için Potasyum)",
    warnings: "Düzensiz sulama (bir kurutup bir çok sulama) meyvelerde çatlamaya yol açar."
  },
  "sigla": {
    name: "Sığla Ağacı", category: "Orman Ağacı", endemic: true,
    moisture: "70 - 90", ph: "6.0 - 7.5",
    light: "Yarı gölge", npk: "Organik kompost",
    warnings: "Kuraklığa karşı son derece toleranssızdır. Nemli ortam şarttır."
  },
  "kasnak": {
    name: "Kasnak Meşesi", category: "Orman Ağacı", endemic: true,
    moisture: "30 - 50", ph: "6.5 - 7.5",
    light: "Tam güneş", npk: "Düşük gereksinim",
    warnings: "Aşırı sulama ve su birikmesi kök çürümesine yol açar. İyi drenaj şarttır."
  }
};

function DijitalTohum({ aktifSayfa }) {
  const objeRef = useRef();

  useLayoutEffect(() => {
    let ctx = gsap.context(() => {
      let t1 = gsap.timeline({
        scrollTrigger: {
          trigger: "#html-icerik",
          start: "top top",
          end: "bottom bottom",
          scrub: 1, 
        }
      });
      t1.to(objeRef.current.position, { x: 3, y: -1, z: 2 }, 0) 
        .to(objeRef.current.rotation, { x: Math.PI * 2, z: Math.PI }, 0) 
        .to(objeRef.current.scale, { x: 1.5, y: 1.5, z: 1.5 }, 0); 
    });
    return () => ctx.revert();
  }, [aktifSayfa]);

  useFrame((state, delta) => {
    if (objeRef.current) {
      objeRef.current.rotation.x += delta * 0.3;
      objeRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={objeRef}>
      <icosahedronGeometry args={[2, 0]} />
      <meshStandardMaterial color="#4ade80" wireframe={true} />
    </mesh>
  );
}

export default function App() {
  // --- NAVİGASYON ---
  const [aktifSayfa, setAktifSayfa] = useState('ana-sayfa');
  const [seciliBitki, setSeciliBitki] = useState('gul');
  const aktifVeri = plantData[seciliBitki];

  const [profilAcik, setProfilAcik] = useState(false);
  const [bahcemAcik, setBahcemAcik] = useState(false);
  const [gecisAcik, setGecisAcik] = useState(false);
  const [aramaTerimi, setAramaTerimi] = useState('');
  const [mesajOdakli, setMesajOdakli] = useState(false);
  const [uzmanMesaji, setUzmanMesaji] = useState('');
  const [yanPanelAcik, setYanPanelAcik] = useState(false);

  // --- KİMLİK DOĞRULAMA (AUTH) ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState(null); 
  const [kayitliKullanicilar, setKayitliKullanicilar] = useState([]); 
  const [aktifKullanici, setAktifKullanici] = useState(''); 
  const [formAd, setFormAd] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSifre, setFormSifre] = useState('');

  // --- PROFİL FOTOĞRAFI ---
  const [profilFotografi, setProfilFotografi] = useState(null); 
  const [profilFotoPos, setProfilFotoPos] = useState({ x: 0, y: 0 }); 
  const [profilFotoZoom, setProfilFotoZoom] = useState(1); 
  const [fotoModalAcik, setFotoModalAcik] = useState(false);
  const [tempFoto, setTempFoto] = useState(null); 
  const [tempPos, setTempPos] = useState({ x: 0, y: 0 }); 
  const [tempZoom, setTempZoom] = useState(1); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dosyaInputRef = useRef(null);
  
  // --- YAPAY ZEKA TEŞHİS ---
  const teshisInputRef = useRef(null);
  const [analizDurumu, setAnalizDurumu] = useState(0);
  const [aiBulgular, setAiBulgular] = useState("");
  const [aiHastalik, setAiHastalik] = useState("");
  const [aiSkor, setAiSkor] = useState("");
  const [aiCozum, setAiCozum] = useState("");
  const [teshisFotoBase64, setTeshisFotoBase64] = useState(null);
  const [teshisFotoMime, setTeshisFotoMime] = useState("");
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);

  // --- BÖLGE YÖNETİMİ ---
  const [bolgeler, setBolgeler] = useState([]); 
  const [bolgeModalAcik, setBolgeModalAcik] = useState(false); 
  const [yeniBolgeAdi, setYeniBolgeAdi] = useState('');
  const [yeniBolgeIsik, setYeniBolgeIsik] = useState('0 - 2 saat');
  const [acikMenuIndex, setAcikMenuIndex] = useState(null);
  const [duzenleModalAcik, setDuzenleModalAcik] = useState(false); 
  const [silModalAcik, setSilModalAcik] = useState(false);
  const [aktifBolgeIndex, setAktifBolgeIndex] = useState(null);
  const [duzenleBolgeAdi, setDuzenleBolgeAdi] = useState('');
  const [duzenleBolgeIsik, setDuzenleBolgeIsik] = useState('0 - 2 saat');

  // Arka plan kaymasını engelle (Scroll Bleed Fix)
  useEffect(() => {
    if (fotoModalAcik || bolgeModalAcik || duzenleModalAcik || silModalAcik || yanPanelAcik || authMode) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [fotoModalAcik, bolgeModalAcik, duzenleModalAcik, silModalAcik, yanPanelAcik, authMode]);

  const sayfayaGit = (sayfaAdi) => {
    setAktifSayfa(sayfaAdi);
    setYanPanelAcik(false); 
    setProfilAcik(false); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- YETKİLENDİRME FONKSİYONLARI ---
  const handleKayıtOl = () => {
    if(!formAd || !formEmail || !formSifre) { 
      alert("Lütfen tüm alanları doldurun."); 
      return; 
    }
    const varMi = kayitliKullanicilar.find(u => u.email === formEmail);
    if(varMi) { 
      alert("Bu e-posta adresi zaten kayıtlı."); 
      return; 
    }
    setKayitliKullanicilar([...kayitliKullanicilar, { ad: formAd, email: formEmail, sifre: formSifre }]);
    alert("Kayıt başarılı! Lütfen giriş yapınız.");
    setAuthMode('login'); 
    setFormSifre(''); 
  };

  const handleGirisYap = () => {
    if(!formEmail || !formSifre) { 
      alert("Lütfen e-posta ve şifrenizi girin."); 
      return; 
    }
    const kullanici = kayitliKullanicilar.find(u => u.email === formEmail && u.sifre === formSifre);
    if(kullanici) {
      setIsLoggedIn(true); 
      setAktifKullanici(kullanici.ad); 
      setAuthMode(null);
      setFormEmail(''); 
      setFormSifre(''); 
      setFormAd('');
    } else {
      alert("E-posta veya şifre hatalı.");
    }
  };

  const handleCikisYap = () => {
    setIsLoggedIn(false); 
    setAktifKullanici(''); 
    setProfilAcik(false);
    setProfilFotografi(null); 
    sayfayaGit('ana-sayfa');
  };

  // Korumalı sayfalar için uyarı ekranı
  const renderKilitliEkran = (baslik) => (
    <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px', textAlign: 'center' }}>
      <h2 className="slide-title">{baslik}</h2>
      <div className="content-area" style={{ 
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', 
        background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', borderRadius: '20px', 
        border: '1px solid rgba(255,255,255,0.05)', maxWidth: '600px', margin: '0 auto' 
      }}>
        <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔒</div>
        <h3 style={{ color: '#f8fafc', marginBottom: '15px', fontSize: '24px' }}>Bu Sayfa Korumalıdır</h3>
        <p style={{ color: '#94a3b8', marginBottom: '30px', fontSize: '16px' }}>Kişisel verilerinizi ve cihazlarınızı görüntülemek için lütfen sisteme giriş yapın.</p>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setAuthMode('login')} style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '12px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Giriş Yap</button>
          <button onClick={() => setAuthMode('register')} style={{ background: 'transparent', color: '#4ade80', border: '2px solid #4ade80', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Kayıt Ol</button>
        </div>
      </div>
    </div>
  );

  // --- GEMINI AI BAĞLANTISI ---
  const geminiAnalizEt = async (base64String, mimeType, ekNot = "") => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
   try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = ekNot 
        ? `Kullanıcı fotoğraftaki bulguları şu şekilde düzeltti: "${ekNot}". Bu yeni bilgiye ve görsele dayanarak hastalığı tekrar analiz et. Lütfen SADECE şu JSON formatında cevap ver: {"bulgular": "Yeni duruma göre tespitler", "hastalik": "Hastalığın adı", "skor": "%XX Doğruluk", "cozum": "Yapılması gerekenler"}`
        : `Sen uzman bir ziraat mühendisisin. Bu bitki fotoğrafını incele. Lütfen SADECE şu JSON formatında cevap ver: {"bulgular": "Görselde tespit edilen lekeler vs.", "hastalik": "Hastalığın adı", "skor": "%XX Doğruluk", "cozum": "Çözüm önerisi"}`;

      const imageParts = [{ inlineData: { data: base64String.split(",")[1], mimeType: mimeType } }];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      let text = response.text();
      
      console.log("Yapay Zekadan Gelen Ham Metin:", text); 

      try {
        let temizText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const veri = JSON.parse(temizText);
        
        setAiBulgular(veri.bulgular || "Bulgu tespit edilemedi.");
        setAiHastalik(veri.hastalik || "Teşhis Konulamadı");
        setAiSkor(veri.skor || "%0");
        setAiCozum(veri.cozum || "Çözüm önerisi bulunamadı.");

      } catch (parseError) {
        console.warn("JSON Çevirme Hatası:", parseError);
        setAiBulgular("Yapay zeka analiz yaptı ancak standart formata uymadı. Konsolu kontrol et.");
        setAiHastalik("Biçim Hatası");
        setAiSkor("-");
        setAiCozum(text); 
      }

      setDuzenlemeModu(false); 
      setAnalizDurumu(2); 

    } catch (error) {
      console.error("Yapay Zeka Hatası:", error);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await res.json();
        const modelIsimleri = data.models.map(m => m.name.split("/")[1]).filter(name => name.includes("gemini"));
        alert("Model hatası! Konsoldaki (F12) listeyi kontrol edin.\nŞu modeller açık:\n" + modelIsimleri.join(", "));
        console.log("👉 KULLANILABİLİR MODELLER:", modelIsimleri);
      } catch (fetchError) {
        alert("Hata Oluştu: " + error.message);
      }
      setAnalizDurumu(0);
    }
  };

  const teshisFotoSecimiBaslat = () => {
    if (teshisInputRef.current) teshisInputRef.current.click();
  };

  const teshisFotoYuklendi = (event) => {
    const dosya = event.target.files[0];
    if (dosya) {
      setAnalizDurumu(1); 
      const okuyucu = new FileReader();
      okuyucu.readAsDataURL(dosya);
      okuyucu.onload = () => {
        setTeshisFotoBase64(okuyucu.result);
        setTeshisFotoMime(dosya.type);
        geminiAnalizEt(okuyucu.result, dosya.type, "");
      };
      event.target.value = null;
    }
  };

  const teshisTekrarAnaliz = () => {
    setAnalizDurumu(1);
    geminiAnalizEt(teshisFotoBase64, teshisFotoMime, aiBulgular);
  };

  // --- PROFİL FOTOĞRAFI FONKSİYONLARI ---
  const openFotoModal = () => { 
    setTempFoto(profilFotografi); 
    setTempPos(profilFotoPos); 
    setTempZoom(profilFotoZoom); 
    setFotoModalAcik(true); 
    setProfilAcik(false); 
  };
  const fotoSecimiBaslat = () => { 
    if (dosyaInputRef.current) dosyaInputRef.current.click(); 
  };
  const fotoYuklendi = (event) => {
    const dosya = event.target.files[0];
    if (dosya) { 
      const fotoUrl = URL.createObjectURL(dosya); 
      setTempFoto(fotoUrl); 
      setTempPos({ x: 0, y: 0 }); 
      setTempZoom(1); 
      event.target.value = null; 
    }
  };
  const handleMouseDown = (e) => { 
    e.preventDefault(); 
    if (!tempFoto) return; 
    setIsDragging(true); 
    setDragStart({ x: e.clientX - tempPos.x, y: e.clientY - tempPos.y }); 
  };
  const handleMouseMove = (e) => { 
    if (!isDragging) return; 
    setTempPos({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y }); 
  };
  const handleMouseUp = () => { setIsDragging(false); };
  const handleWheel = (e) => { 
    if (!tempFoto) return; 
    setTempZoom((prev) => { 
      const yeniZoom = prev - e.deltaY * 0.002; 
      return Math.min(Math.max(0.3, yeniZoom), 5); 
    }); 
  };
  const fotoKaydet = () => { 
    setProfilFotografi(tempFoto); 
    setProfilFotoPos(tempPos); 
    setProfilFotoZoom(tempZoom); 
    setFotoModalAcik(false); 
  };
  const fotoSil = () => { 
    setTempFoto(null); 
    setTempPos({ x: 0, y: 0 }); 
    setTempZoom(1); 
  };

  // --- BÖLGE CRUD FONKSİYONLARI ---
  const bolgeKaydet = () => { 
    if(yeniBolgeAdi.trim() === "") { alert("Lütfen bölge ismini giriniz."); return; } 
    setBolgeler([...bolgeler, { isim: yeniBolgeAdi, isik: yeniBolgeIsik }]); 
    setBolgeModalAcik(false); 
    setYeniBolgeAdi(''); 
    setYeniBolgeIsik('0 - 2 saat'); 
  };
  const duzenleTetikle = (index) => { 
    setAktifBolgeIndex(index); 
    setDuzenleBolgeAdi(bolgeler[index].isim); 
    setDuzenleBolgeIsik(bolgeler[index].isik); 
    setAcikMenuIndex(null); 
    setDuzenleModalAcik(true); 
  };
  const bolgeDuzenleKaydet = () => { 
    if(duzenleBolgeAdi.trim() === "") { alert("Bölge ismi boş olamaz."); return; } 
    const guncelBolgeler = [...bolgeler]; 
    guncelBolgeler[aktifBolgeIndex] = { isim: duzenleBolgeAdi, isik: duzenleBolgeIsik }; 
    setBolgeler(guncelBolgeler); 
    setDuzenleModalAcik(false); 
  };
  const silTetikle = (index) => { 
    setAktifBolgeIndex(index); 
    setAcikMenuIndex(null); 
    setSilModalAcik(true); 
  };
  const bolgeSilOnay = () => { 
    const kalanBolgeler = bolgeler.filter((_, i) => i !== aktifBolgeIndex); 
    setBolgeler(kalanBolgeler); 
    setSilModalAcik(false); 
  };


  return (
    <>
      <input type="file" accept="image/*" ref={dosyaInputRef} style={{ display: 'none' }} onChange={fotoYuklendi} />
      <input type="file" accept="image/*" ref={teshisInputRef} style={{ display: 'none' }} onChange={teshisFotoYuklendi} /> 

      <div className="canvas-container">
        <Canvas camera={{ position: [0, 0, 6] }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[10, 10, 10]} intensity={2} />
          <DijitalTohum aktifSayfa={aktifSayfa} />
        </Canvas>
      </div>

      {/* AUTH (GİRİŞ/KAYIT) MODALLARI */}
      {authMode && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          zIndex: 11000, animation: 'fadeIn 0.3s ease' 
        }}>
          <div style={{ 
            background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(74, 222, 128, 0.3)', 
            padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', 
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', position: 'relative' 
          }}>
            <button onClick={() => setAuthMode(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            
            <h3 style={{ color: '#4ade80', fontSize: '26px', margin: '0 0 25px 0', textAlign: 'center' }}>
              {authMode === 'login' ? 'Tekrar Hoş Geldiniz' : 'Aramıza Katılın'}
            </h3>

            {authMode === 'register' && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '13px' }}>Ad Soyad</label>
                <input type="text" placeholder="Örn: Yusuf Biçici" value={formAd} onChange={(e) => setFormAd(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            )}

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '13px' }}>E-posta Adresi</label>
              <input type="email" placeholder="ornek@mail.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '13px' }}>Şifre</label>
              <input type="password" placeholder="••••••••" value={formSifre} onChange={(e) => setFormSifre(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <button onClick={authMode === 'login' ? handleGirisYap : handleKayıtOl} style={{ width: '100%', background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginBottom: '15px' }}>
              {authMode === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
            </button>

            <div style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8' }}>
              {authMode === 'login' ? (
                <>Hesabınız yok mu? <span onClick={() => {setAuthMode('register'); setFormSifre('');}} style={{ color: '#4ade80', cursor: 'pointer', textDecoration: 'underline' }}>Kayıt Olun</span></>
              ) : (
                <>Zaten hesabınız var mı? <span onClick={() => {setAuthMode('login'); setFormSifre('');}} style={{ color: '#4ade80', cursor: 'pointer', textDecoration: 'underline' }}>Giriş Yapın</span></>
              )}
            </div>
          </div>
        </div>
      )}

      {/* YAN PANEL (SIDEBAR) BÖLÜMÜ */}
      {yanPanelAcik && (
        <div onClick={() => setYanPanelAcik(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9998, animation: 'fadeIn 0.3s ease' }} />
      )}
      
      <div style={{
        position: 'fixed', top: 0, left: 0, height: '100vh', width: '300px',
        background: 'rgba(10, 20, 15, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(74, 222, 128, 0.2)',
        transform: yanPanelAcik ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 9999,
        padding: '30px 20px', display: 'flex', flexDirection: 'column', boxShadow: yanPanelAcik ? '10px 0 30px rgba(0,0,0,0.5)' : 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '20px' }}>
          <h2 style={{ color: '#4ade80', fontSize: '20px', margin: 0 }}>MENÜ</h2>
          <button onClick={() => setYanPanelAcik(false)} style={{ background: 'transparent', border: 'none', color: '#f8fafc', fontSize: '24px', cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="menu-item" onClick={() => sayfayaGit('ana-sayfa')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'ana-sayfa' ? '#4ade80' : '#cbd5e1' }}>🏠 Ana Sayfa</button>
          <button className="menu-item" onClick={() => sayfayaGit('kullanici-paneli')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'kullanici-paneli' ? '#4ade80' : '#cbd5e1' }}>👤 Kullanıcı Paneli</button>
          <button className="menu-item" onClick={() => sayfayaGit('bahcem')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'bahcem' ? '#4ade80' : '#cbd5e1' }}>🪴 Bahçem</button>
          <button className="menu-item" onClick={() => sayfayaGit('botanik-bahce')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'botanik-bahce' ? '#4ade80' : '#cbd5e1' }}>🌿 Botanik Bahçe</button>
          <button className="menu-item" onClick={() => sayfayaGit('ai-teshis')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'ai-teshis' ? '#4ade80' : '#cbd5e1' }}>🤖 AI Teşhis</button>
          <button className="menu-item" onClick={() => sayfayaGit('uzmana-sor')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'uzmana-sor' ? '#4ade80' : '#cbd5e1' }}>👨‍🌾 Uzmana Sor</button>
          <button className="menu-item" onClick={() => sayfayaGit('fidan-bagisi')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'fidan-bagisi' ? '#4ade80' : '#cbd5e1' }}>🌳 Fidan Bağışı</button>
          <button className="menu-item" onClick={() => sayfayaGit('hakkimizda')} style={{ fontSize: '16px', padding: '12px', color: aktifSayfa === 'hakkimizda' ? '#4ade80' : '#cbd5e1' }}>ℹ️ Hakkımızda</button>
        </div>
      </div>

      {/* ÜST MENÜ (NAVBAR) BÖLÜMÜ */}
      <nav className="navbar" style={{ padding: '20px 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
        
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <div onClick={() => setYanPanelAcik(true)} style={{ cursor: 'pointer', marginRight: '20px', display: 'flex', alignItems: 'center' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '10px'}} onClick={() => sayfayaGit('ana-sayfa')} cursor="pointer">
            <path d="M6 11H18L16 20H8L6 11Z" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M4 11H20" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M12 11V3" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 8C12 8 15 4 18 4C19.5 4 20.5 5 20.5 6C20.5 8.5 16 10 12 10" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M12 6C12 6 9 2 6 2C4.5 2 3.5 3 3.5 4C3.5 6.5 8 8 12 8" stroke="#4ade80" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          {/* YENİ LOGO METNİ */}
          <span onClick={() => sayfayaGit('ana-sayfa')} style={{cursor: 'pointer', fontSize: '18px', whiteSpace: 'nowrap', fontWeight: 'bold', letterSpacing: '1px'}}>
            AKILLI <span style={{ color: '#4ade80' }}>BOTANİK</span> DANIŞMANI
          </span>
        </div>
        
        <ul className="nav-links" style={{ display: 'flex', gap: '1.5vw', margin: '0 auto', padding: 0, listStyle: 'none', alignItems: 'center' }}>
          <li><a href="#" style={{ color: aktifSayfa === 'kullanici-paneli' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('kullanici-paneli'); }}>Kullanıcı Paneli</a></li>
          <li><a href="#" style={{ color: aktifSayfa === 'bahcem' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('bahcem'); }}>Bahçem</a></li>
          <li><a href="#" style={{ color: aktifSayfa === 'botanik-bahce' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('botanik-bahce'); }}>Botanik Bahçe</a></li>
          <li><a href="#" style={{ color: aktifSayfa === 'ai-teshis' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('ai-teshis'); }}>AI Teşhis</a></li>
          <li><a href="#" style={{ color: aktifSayfa === 'uzmana-sor' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('uzmana-sor'); }}>Uzmana Sor</a></li>
          <li><a href="#" style={{ color: aktifSayfa === 'fidan-bagisi' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('fidan-bagisi'); }}>Fidan Bağışı</a></li>
          <li><a href="#" style={{ color: aktifSayfa === 'hakkimizda' ? '#4ade80' : '#cbd5e1', textDecoration: 'none', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap' }} onClick={(e) => { e.preventDefault(); sayfayaGit('hakkimizda'); }}>Hakkımızda</a></li>
        </ul>
        
        {/* PROFİL VE GİRİŞ YAP ALANI */}
        <div className="profile-container" style={{ flexShrink: 0, marginLeft: 'auto' }}>
          {!isLoggedIn ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setAuthMode('login')} style={{ background: 'transparent', color: '#4ade80', border: '1px solid #4ade80', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Giriş Yap</button>
              <button onClick={() => setAuthMode('register')} style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}>Kayıt Ol</button>
            </div>
          ) : (
            <>
              <div 
                className="profile-trigger" 
                onClick={() => setProfilAcik(!profilAcik)} 
                style={{ 
                  background: profilFotografi ? 'transparent' : 'linear-gradient(45deg, #4ade80, #10b981)', 
                  border: profilFotografi ? '2px solid #4ade80' : 'none',
                  padding: profilFotografi ? '0' : '10px',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px', borderRadius: '50%', position: 'relative', cursor: 'pointer'
                }}
              >
                {profilFotografi ? (
                  <img 
                    src={profilFotografi} 
                    alt="Profil" 
                    style={{ 
                      position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', 
                      transform: `translate(${profilFotoPos.x * 0.16}px, ${profilFotoPos.y * 0.16}px) scale(${profilFotoZoom})`, 
                      pointerEvents: 'none' 
                    }} 
                  />
                ) : (
                  <i className="fa-solid fa-user" style={{ color: '#050505', fontSize: '18px' }}></i>
                )}
              </div>

              {profilAcik && (
                <div className="profile-dropdown">
                  <div className="profile-name">{aktifKullanici}</div>
                  <button className="menu-item" onClick={openFotoModal}>Profil Fotoğrafını Düzenle</button>
                  <button className="menu-item logout-item" onClick={handleCikisYap}>Çıkış Yap</button>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* PROFİL FOTOĞRAFI DÜZENLEME MODALI */}
      {fotoModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '450px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '24px', margin: '0 0 25px 0' }}>Profil Fotoğrafını Düzenle</h3>
            
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '15px' }}>
              {tempFoto ? "Görüntüyü sürükleyin. Yakınlaştırmak için mouse topunu kaydırın." : "Lütfen bir fotoğraf seçin."}
            </p>

            <div 
              style={{
                width: '250px', height: '250px', borderRadius: '50%', margin: '0 auto 25px auto',
                border: '3px dashed rgba(74, 222, 128, 0.6)', overflow: 'hidden', position: 'relative',
                background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: tempFoto ? (isDragging ? 'grabbing' : 'grab') : 'default'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel} 
            >
              {tempFoto ? (
                <img 
                  src={tempFoto} 
                  alt="Önizleme" 
                  style={{ 
                    position: 'absolute', width: '100%', height: '100%', objectFit: 'cover',
                    transform: `translate(${tempPos.x}px, ${tempPos.y}px) scale(${tempZoom})`, 
                    pointerEvents: 'none', userSelect: 'none'
                  }} 
                />
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '50px' }}>👤</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px' }}>
              <button onClick={fotoSecimiBaslat} style={{ background: 'transparent', color: '#4ade80', border: '1px solid #4ade80', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                📷 Yeni Fotoğraf Seç
              </button>
              {tempFoto && (
                <button onClick={fotoSil} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
                  🗑️ Fotoğrafı Sil
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
              <button onClick={() => setFotoModalAcik(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}>İptal</button>
              <button onClick={fotoKaydet} style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Kaydet</button>
            </div>
          </div>
        </div>
      )}

      {/* BÖLGE EKLEME MODALI */}
      {bolgeModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '24px', margin: '0 0 25px 0' }}>Bölge Ekle</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Bölge İsmi</label>
              <input type="text" placeholder="Örn: Balkon, Salon..." value={yeniBolgeAdi} onChange={(e) => setYeniBolgeAdi(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '16px', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = 'rgba(74, 222, 128, 0.3)'} />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Günlük Işık Alma Miktarı</label>
              <select value={yeniBolgeIsik} onChange={(e) => setYeniBolgeIsik(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '16px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                <option value="0 - 2 saat" style={{background: '#0f172a'}}>0 - 2 saat</option>
                <option value="2 - 4 saat" style={{background: '#0f172a'}}>2 - 4 saat</option>
                <option value="4 - 6 saat" style={{background: '#0f172a'}}>4 - 6 saat</option>
                <option value="6+ saat" style={{background: '#0f172a'}}>6+ saat</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={() => { setBolgeModalAcik(false); setYeniBolgeAdi(''); setYeniBolgeIsik('0 - 2 saat'); }} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}>İptal</button>
              <button onClick={bolgeKaydet} style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Ekle 🌿</button>
            </div>
          </div>
        </div>
      )}

      {/* BÖLGE DÜZENLEME MODALI */}
      {duzenleModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <h3 style={{ color: '#f8fafc', fontSize: '24px', margin: '0 0 25px 0' }}>Bölgeyi Düzenle</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Bölge İsmi</label>
              <input type="text" placeholder="Örn: Balkon, Salon..." value={duzenleBolgeAdi} onChange={(e) => setDuzenleBolgeAdi(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '16px', outline: 'none', transition: 'all 0.3s ease', boxSizing: 'border-box' }} onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = 'rgba(74, 222, 128, 0.3)'} />
            </div>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '8px', fontSize: '14px' }}>Günlük Işık Alma Miktarı</label>
              <select value={duzenleBolgeIsik} onChange={(e) => setDuzenleBolgeIsik(e.target.value)} style={{ width: '100%', padding: '12px 15px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '10px', color: '#fff', fontSize: '16px', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}>
                <option value="0 - 2 saat" style={{background: '#0f172a'}}>0 - 2 saat</option>
                <option value="2 - 4 saat" style={{background: '#0f172a'}}>2 - 4 saat</option>
                <option value="4 - 6 saat" style={{background: '#0f172a'}}>4 - 6 saat</option>
                <option value="6+ saat" style={{background: '#0f172a'}}>6+ saat</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={() => setDuzenleModalAcik(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}>İptal</button>
              <button onClick={bolgeDuzenleKaydet} style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Düzenle</button>
            </div>
          </div>
        </div>
      )}

      {/* BÖLGE SİLME UYARI MODALI */}
      {silModalAcik && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.3s ease' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'center' }}>
            <div style={{ fontSize: '40px', marginBottom: '15px' }}>⚠️</div>
            <h3 style={{ color: '#f8fafc', fontSize: '22px', margin: '0 0 15px 0' }}>Bölgeyi Sil</h3>
            <p style={{ color: '#cbd5e1', marginBottom: '30px' }}>Bölgeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
              <button onClick={() => setSilModalAcik(false)} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px' }}>İptal</button>
              <button onClick={bolgeSilOnay} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Sil</button>
            </div>
          </div>
        </div>
      )}

      {/* İÇERİK BÖLÜMÜ */}
      <div id="html-icerik" style={{ minHeight: '100vh', paddingTop: '20px' }}>
        
        {/* ================= 1. ANA SAYFA ================= */}
        {aktifSayfa === 'ana-sayfa' && (
          <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
            <div className="slide-container title-layout">
              <h1>Akıllı Tohum: <span className="accent">Geleceği</span> Ekiyoruz</h1>
              <p className="subtitle">Veri Odaklı Tarımın Yeni Standartı: Yapay Zeka ve Biyolojiyle Filizlenen Bir Teknoloji Devrimi.</p>
              
              <button onClick={() => sayfayaGit('kullanici-paneli')} style={{ marginTop: '50px', padding: '16px 40px', fontSize: '18px', fontWeight: 'bold', background: 'transparent', color: '#4ade80', border: '2px solid #4ade80', borderRadius: '50px', cursor: 'pointer', transition: 'all 0.3s ease' }} onMouseOver={(e) => { e.target.style.background = 'rgba(74, 222, 128, 0.1)'; e.target.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.4)'; }} onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none'; }}>
                Kullanıcı Panelimi Görüntüle ↗
              </button>
            </div>

            <div className="slide-container" style={{ marginTop: '50px' }}>
              <h2 className="slide-title">Problem ve <span className="gold">Çözüm</span></h2>
              <div className="content-area">
                <div className="two-column tiled">
                  <div>
                    <h3><span className="accent">!</span> Problem</h3>
                    <p>Geleneksel tarım, değişen iklim koşullarına ayak uyduramıyor. Yanlış sulama ve besleme bitki kayıplarına yol açıyor.</p>
                  </div>
                  <div>
                    <h3><span className="gold">✓</span> Çözüm</h3>
                    <p>Otonom IoT destekli saksılarımız, bitki kütüphanesindeki ideal verileri çekerek her bitkiye özel bakım uygular.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. KULLANICI PANELİ ================= */}
        {aktifSayfa === 'kullanici-paneli' && (
          !isLoggedIn ? renderKilitliEkran('Kullanıcı Paneli') : (
            <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px' }}>
              <h2 className="slide-title">Kullanıcı <span className="gold">Paneli</span></h2>
              <div className="content-area">
                
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', width: '100%' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                      <h3 style={{ fontSize: '28px', color: '#f8fafc', margin: 0 }}>Saksılarım (Aygıtlar)</h3>
                      <button style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ Aygıt Bağla</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '25px', borderRadius: '15px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '12px', height: '12px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 10px #4ade80' }}></div>
                        <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '22px' }}>Pencere Fesleğeni</h4>
                        <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 20px 0' }}>Donanım ID: SAKS-01A</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px' }}>
                            <span style={{ color: '#38bdf8' }}>💧 Anlık Nem</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>%52 (İdeal)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px' }}>
                            <span style={{ color: '#fbbf24' }}>🔋 Batarya</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>%85</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '25px', borderRadius: '15px', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }}></div>
                        <h4 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '22px' }}>Ofis Kaktüsü</h4>
                        <p style={{ fontSize: '14px', color: '#cbd5e1', margin: '0 0 20px 0' }}>Donanım ID: SAKS-02B</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px' }}>
                            <span style={{ color: '#ef4444' }}>💧 Anlık Nem</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>%12 (Kritik)</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '10px 15px', borderRadius: '8px' }}>
                            <span style={{ color: '#a3e635' }}>🧪 pH</span>
                            <span style={{ color: '#fff', fontWeight: 'bold' }}>7.1</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(251, 191, 36, 0.05)', backdropFilter: 'blur(10px)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                    <h3 style={{ fontSize: '24px', color: '#fbbf24', margin: '0 0 25px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>🔔 Hatırlatıcılar</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div style={{ background: 'rgba(0,0,0,0.4)', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>BUGÜN - 14:30</div>
                        <div style={{ color: '#fff', fontSize: '15px' }}>Ofis Kaktüsü kritik su seviyesinde. Otonom sulama başlatılsın mı?</div>
                        <button style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '5px', marginTop: '10px', fontSize: '12px', cursor: 'pointer' }}>Sula</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* ================= 3. BAHÇEM ================= */}
        {aktifSayfa === 'bahcem' && (
          !isLoggedIn ? renderKilitliEkran('Benim Bahçem') : (
            <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px' }}>
              <h2 className="slide-title">Benim <span className="accent">Bahçem</span></h2>
              <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '40px', fontSize: '16px' }}>Evinizdeki veya seranızdaki bölgeleri oluşturun ve yönetin.</p>
              
              <div className="content-area">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
                  
                  {bolgeler.map((bolge, index) => (
                    <div key={index} style={{ 
                      background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(74, 222, 128, 0.3)', 
                      borderRadius: '20px', padding: '30px', width: '260px', height: '320px', 
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      boxSizing: 'border-box', position: 'relative'
                    }}>
                      <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                        <button onClick={() => setAcikMenuIndex(acikMenuIndex === index ? null : index)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '24px', cursor: 'pointer', padding: '0 5px', lineHeight: '1' }}>⋮</button>
                        
                        {acikMenuIndex === index && (
                          <div style={{ position: 'absolute', top: '100%', right: '0', background: 'rgba(15, 23, 42, 0.98)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '8px', padding: '8px', zIndex: 100, width: '175px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <button onClick={() => duzenleTetikle(index)} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#f8fafc', padding: '8px', cursor: 'pointer', borderRadius: '5px', fontSize: '13px' }} onMouseOver={(e)=>e.target.style.background='rgba(255,255,255,0.05)'} onMouseOut={(e)=>e.target.style.background='transparent'}>✏️ Bölgeyi Düzenle</button>
                            <button onClick={() => silTetikle(index)} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#ef4444', padding: '8px', cursor: 'pointer', borderRadius: '5px', fontSize: '13px' }} onMouseOver={(e)=>e.target.style.background='rgba(239, 68, 68, 0.1)'} onMouseOut={(e)=>e.target.style.background='transparent'}>🗑️ Bölgeyi Sil</button>
                          </div>
                        )}
                      </div>

                      <div style={{ fontSize: '50px', marginBottom: '20px' }}>🪴</div>
                      <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 10px 0', textAlign: 'center' }}>{bolge.isim}</h3>
                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 15px', borderRadius: '8px', color: '#fbbf24', fontSize: '14px', marginTop: 'auto' }}>☀️ {bolge.isik}</div>
                    </div>
                  ))}

                  <div onClick={() => setBolgeModalAcik(true)} style={{ background: 'transparent', border: '2px dashed rgba(74, 222, 128, 0.5)', borderRadius: '20px', padding: '30px', width: '260px', height: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', boxSizing: 'border-box' }} onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(74, 222, 128, 0.05)'; e.currentTarget.style.borderColor = '#4ade80'; }} onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(74, 222, 128, 0.5)'; }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', marginBottom: '20px' }}>+</div>
                    <h3 style={{ color: '#4ade80', fontSize: '20px', margin: 0 }}>Yeni Bölge Ekle</h3>
                  </div>

                </div>
              </div>
            </div>
          )
        )}

        {/* ================= 4. BOTANİK BAHÇE (Herkese Açık) ================= */}
        {aktifSayfa === 'botanik-bahce' && (
          <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px' }}>
            <h2 className="slide-title"><span className="accent">Bitkiler Hakkında </span> <span className="slide-title-2">Daha Fazlası</span></h2>
            
            <div style={{ display: 'flex', gap: '40px', width: '100%', marginTop: '20px' }}>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ width: '100%' }}>
                  <h3 style={{ marginBottom: '15px', color: '#4ade80', fontSize: '20px' }}>Sistemdeki Türler:</h3>
                  <input type="text" placeholder="🔍 Bitki ara (Örn: Gül, Domates)..." value={aramaTerimi} onChange={(e) => setAramaTerimi(e.target.value)} style={{ width: '98%', padding: '12px 15px', marginBottom: '15px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '15px', transition: 'border-color 0.3s ease' }} onFocus={(e) => e.target.style.borderColor = '#4ade80'} onBlur={(e) => e.target.style.borderColor = 'rgba(74, 222, 128, 0.3)'} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                    {Object.keys(plantData).filter((key) => plantData[key].name.toLowerCase().includes(aramaTerimi.toLowerCase())).map((key) => (
                      <button key={key} onClick={() => setSeciliBitki(key)} style={{ padding: '15px 20px', background: seciliBitki === key ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255,255,255,0.02)', border: `1px solid ${seciliBitki === key ? '#4ade80' : 'rgba(255,255,255,0.1)'}`, borderRadius: '12px', color: seciliBitki === key ? '#fff' : '#cbd5e1', textAlign: 'left', cursor: 'pointer', fontWeight: seciliBitki === key ? 'bold' : 'normal', transition: 'all 0.3s ease', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                        <span>{plantData[key].name}</span>
                        {plantData[key].endemic && <span style={{color: '#fbbf24'}}>★</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ flex: '2', background: 'rgba(16, 185, 129, 0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '20px', padding: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '36px', margin: 0 }}>{aktifVeri.name}</h2>
                    <span style={{ color: '#4ade80', fontSize: '16px' }}>Kategori: {aktifVeri.category}</span>
                  </div>
                  {aktifVeri.endemic && (
                    <div style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '5px 15px', borderRadius: '50px', border: '1px solid #fbbf24', fontSize: '14px', fontWeight: 'bold' }}>★ Endemik Tür</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
                    <h4 style={{ color: '#38bdf8', margin: '0 0 10px 0' }}>💧 İdeal Toprak Nemi</h4>
                    <div style={{ fontSize: '32px', color: '#fff', fontWeight: 'bold' }}>%{aktifVeri.moisture}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
                    <h4 style={{ color: '#c084fc', margin: '0 0 10px 0' }}>🧪 Hedef pH Değeri</h4>
                    <div style={{ fontSize: '32px', color: '#fff', fontWeight: 'bold' }}>{aktifVeri.ph}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
                    <h4 style={{ color: '#fbbf24', margin: '0 0 10px 0' }}>☀️ Işık İhtiyacı</h4>
                    <div style={{ fontSize: '18px', color: '#fff' }}>{aktifVeri.light}</div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '15px' }}>
                    <h4 style={{ color: '#a3e635', margin: '0 0 10px 0' }}>🌱 N-P-K Gübreleme</h4>
                    <div style={{ fontSize: '18px', color: '#fff' }}>{aktifVeri.npk}</div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '20px', borderRadius: '15px' }}>
                  <h4 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>⚠️ Sistem Uyarısı & Riskler</h4>
                  <p style={{ margin: 0, color: '#fca5a5', fontSize: '16px' }}>{aktifVeri.warnings}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 5. AI TEŞHİS (GERÇEK YAPAY ZEKA) ================= */}
        {aktifSayfa === 'ai-teshis' && (
          <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px' }}>
            <h2 className="slide-title">Yapay Zeka ile <span className="accent">Hastalık Teşhisi</span></h2>
            <div className="content-area">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', width: '100%' }}>
                
                {/* SOL: GÖRSEL YÜKLEME ALANI */}
                <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '24px', color: '#f8fafc', marginBottom: '20px', textAlign: 'center', zIndex: 2 }}>Görsel Yükle</h3>
                  
                  <div onClick={teshisFotoSecimiBaslat} style={{ width: '100%', height: '250px', border: '2px dashed rgba(74, 222, 128, 0.5)', borderRadius: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease', background: analizDurumu > 0 ? 'rgba(74, 222, 128, 0.05)' : 'transparent', zIndex: 2 }} onMouseOver={(e) => { if(analizDurumu === 0) e.currentTarget.style.background = 'rgba(74, 222, 128, 0.1)'}} onMouseOut={(e) => { if(analizDurumu === 0) e.currentTarget.style.background = 'transparent'}}>
                    
                    {teshisFotoBase64 && analizDurumu > 0 ? (
                      <img src={teshisFotoBase64} alt="Teşhis" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', opacity: 0.5 }} />
                    ) : (
                      <>
                        <span style={{ fontSize: '40px', marginBottom: '15px' }}>📸</span>
                        <p style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '18px' }}>Fotoğraf Çek veya Sürükle</p>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '10px' }}>Desteklenen formatlar: JPG, PNG</p>
                      </>
                    )}
                  </div>
                </div>

                {/* SAĞ: ANALİZ SONUÇLARI */}
                <div style={{ background: 'rgba(16, 185, 129, 0.04)', backdropFilter: 'blur(12px)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '20px', padding: '40px', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '24px', color: '#f8fafc', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>🤖 AI Botanist Analizi</h3>

                  {analizDurumu === 0 && (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', lineHeight: '1.6' }}>
                      Lütfen teşhis için sol taraftan bir bitki fotoğrafı yükleyin.<br/>Sistemimiz Yapay Zeka algoritmasıyla yaprak ve gövde yapısını inceleyerek saniyeler içinde hastalık tespiti yapacaktır.
                    </div>
                  )}

                  {analizDurumu === 1 && (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                      <div style={{ fontSize: '40px', marginBottom: '20px', animation: 'spin 2s linear infinite' }}>⚙️</div>
                      <p style={{ fontWeight: 'bold', fontSize: '18px' }}>Görsel İşleniyor...</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '5px' }}>Yapay Zeka veritabanını tarıyor.</p>
                    </div>
                  )}

                  {analizDurumu === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', animation: 'fadeIn 0.5s' }}>
                      
                      <div style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ color: '#cbd5e1', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>GÖRSEL ANALİZİ (BULGULAR)</div>
                        
                        {duzenlemeModu ? (
                          <>
                            <textarea 
                              value={aiBulgular} 
                              onChange={(e) => setAiBulgular(e.target.value)} 
                              style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.5)', border: '1px solid #4ade80', color: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '10px', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                              <button onClick={() => setDuzenlemeModu(false)} style={{ flex: 1, background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '6px', borderRadius: '6px', cursor: 'pointer' }}>İptal</button>
                              <button onClick={teshisTekrarAnaliz} style={{ flex: 2, background: '#fbbf24', color: '#050505', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>🔄 Yeniden Analiz Et</button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ color: '#f8fafc', fontSize: '14px', marginBottom: '12px', fontStyle: 'italic', lineHeight: '1.5' }}>"{aiBulgular}"</div>
                            <button onClick={() => setDuzenlemeModu(true)} style={{ background: 'transparent', color: '#fbbf24', border: '1px solid #fbbf24', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>✏️ Tespiti Düzenle</button>
                          </>
                        )}
                      </div>

                      <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>TEŞHİS SONUCU</div>
                        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>{aiHastalik}</div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '8px' }}>
                        <span style={{ color: '#cbd5e1' }}>AI Güven Skoru:</span>
                        <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{aiSkor}</span>
                      </div>

                      <div style={{ background: 'rgba(56, 189, 248, 0.1)', borderLeft: '4px solid #38bdf8', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ color: '#38bdf8', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>OTONOM ÇÖZÜM ÖNERİSİ</div>
                        <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{aiCozum}</div>
                      </div>

                      <button style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>Tedavi Planını Onayla ve Sisteme İşle</button>
                      
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= 6. UZMANA SOR ================= */}
        {aktifSayfa === 'uzmana-sor' && (
          !isLoggedIn ? renderKilitliEkran('Uzmana Sor') : (
            <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px' }}>
              <h2 className="slide-title">Uzmana <span className="gold">Sor</span></h2>
              <div className="content-area">
                <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', padding: '40px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                  <h3 style={{ fontSize: '24px', color: '#f8fafc', marginBottom: '10px' }}>👨‍🌾 Ziraat Mühendislerimize Ulaşın</h3>
                  <p style={{ color: '#cbd5e1', marginBottom: '30px', fontSize: '16px' }}>Uzmanlarımıza, destek almak isteğiniz konuyu yazınız.</p>

                  <div style={{ position: 'relative', width: '100%' }}>
                    <textarea placeholder="Mesajınızı Yazın..." value={uzmanMesaji} onChange={(e) => setUzmanMesaji(e.target.value)} onFocus={() => setMesajOdakli(true)}
                      style={{ width: '100%', minHeight: mesajOdakli ? '180px' : '60px', padding: '18px 20px', background: 'rgba(0, 0, 0, 0.3)', border: `1px solid ${mesajOdakli ? '#4ade80' : 'rgba(74, 222, 128, 0.3)'}`, borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '16px', transition: 'all 0.3s ease', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    {mesajOdakli && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px', gap: '15px', animation: 'fadeIn 0.3s ease-in' }}>
                        <button onClick={() => { setMesajOdakli(false); setUzmanMesaji(''); }} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', transition: 'all 0.2s ease' }} onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseOut={(e) => e.target.style.background = 'transparent'}>İptal</button>
                        <button onClick={() => { if(uzmanMesaji.trim() !== "") { alert("Mesajınız başarıyla iletilmiştir."); setMesajOdakli(false); setUzmanMesaji(''); } else { alert("Lütfen mesaj giriniz."); } }} style={{ background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '10px 30px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s ease' }} onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}>Gönder ↗</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        
        {/* ================= 7. FİDAN BAĞIŞI (RESTORE EDİLDİ) ================= */}
        {aktifSayfa === 'fidan-bagisi' && (
          <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px', paddingBottom: '80px' }}>
            <h2 className="slide-title">Doğaya <span className="accent">Can Ver</span></h2>
            <div className="content-area">
              
              <div style={{ textAlign: 'center', marginBottom: '40px', maxWidth: '800px', margin: '0 auto 40px auto' }}>
                <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.8' }}>
                  Gelecek nesillere daha yeşil ve yaşanabilir bir dünya bırakmak bizim elimizde.
                  Platformumuz üzerinden TEMA Vakfı'na destek olabilir ve adınıza fidan dikilmesini sağlayabilirsiniz.
                  Doğaya katkınız için şimdiden teşekkür ederiz! 🌱
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '30px', maxWidth: '900px', margin: '0 auto' }}>
                
                {/* 1 Fidan Paketi */}
                <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '50px', marginBottom: '15px' }}>🌱</div>
                  <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 10px 0' }}>1 Fidan</h3>
                  <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px', marginBottom: '25px', flexGrow: 1 }}>Bir fidanla değişimi başlatın. Adınıza özel e-sertifika gönderilecektir.</p>
                  <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>150 ₺</div>
                  <button onClick={() => alert("1 Fidan bağışınız için teşekkür ederiz! TEMA Vakfı yönlendirmesi başlatılıyor...")} style={{ width: '100%', background: 'transparent', color: '#4ade80', border: '2px solid #4ade80', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={(e) => { e.target.style.background = '#4ade80'; e.target.style.color = '#050505'; }} onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#4ade80'; }}>Bağış Yap</button>
                </div>

                {/* 5 Fidan Paketi */}
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', backdropFilter: 'blur(10px)', border: '2px solid #4ade80', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', transform: 'scale(1.05)', transition: 'transform 0.3s ease', zIndex: 1 }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.05) translateY(0)'}>
                  <div style={{ position: 'absolute', top: '-15px', background: '#4ade80', color: '#050505', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' }}>En Çok Tercih Edilen</div>
                  <div style={{ fontSize: '50px', marginBottom: '15px' }}>🌳</div>
                  <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 10px 0' }}>5 Fidan</h3>
                  <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px', marginBottom: '25px', flexGrow: 1 }}>Küçük bir koru oluşturun. Fiziksel sertifikanız adresinize gönderilir.</p>
                  <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>750 ₺</div>
                  <button onClick={() => alert("5 Fidan bağışınız için teşekkür ederiz! TEMA Vakfı yönlendirmesi başlatılıyor...")} style={{ width: '100%', background: 'linear-gradient(45deg, #4ade80, #10b981)', color: '#050505', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Hemen Destek Ol</button>
                </div>

                {/* 10 Fidan Paketi */}
                <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '20px', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-10px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ fontSize: '50px', marginBottom: '15px' }}>🌲</div>
                  <h3 style={{ color: '#fff', fontSize: '22px', margin: '0 0 10px 0' }}>10 Fidan</h3>
                  <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '14px', marginBottom: '25px', flexGrow: 1 }}>Geleceğe nefes olun. Adınıza özel fidanlık tabelası oluşturulur.</p>
                  <div style={{ color: '#4ade80', fontSize: '28px', fontWeight: 'bold', marginBottom: '20px' }}>1500 ₺</div>
                  <button onClick={() => alert("10 Fidan bağışınız için muhteşemsiniz! TEMA Vakfı yönlendirmesi başlatılıyor...")} style={{ width: '100%', background: 'transparent', color: '#4ade80', border: '2px solid #4ade80', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s ease' }} onMouseOver={(e) => { e.target.style.background = '#4ade80'; e.target.style.color = '#050505'; }} onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#4ade80'; }}>Bağış Yap</button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= 8. HAKKIMIZDA (RESTORE EDİLDİ) ================= */}
        {aktifSayfa === 'hakkimizda' && (
          <div className="slide-container" style={{ animation: 'fadeIn 0.5s ease-in', paddingTop: '80px', paddingBottom: '80px' }}>
            <h2 className="slide-title">Biz <span className="accent">Kimiz?</span></h2>
            <div className="content-area">
              
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(10px)', padding: '40px', 
                borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', maxWidth: '900px', 
                margin: '0 auto', width: '100%', lineHeight: '1.8', color: '#cbd5e1', fontSize: '16px', textAlign: 'justify' 
              }}>
                <p style={{ marginBottom: '20px' }}>
                  Akıllı Botanik Danışmanı, bitki bakımını daha bilinçli, verimli ve sürdürülebilir hale getirmek amacıyla geliştirilmiş yenilikçi bir dijital platformdur. Günümüzde birçok kişi bitki yetiştirmeye ilgi duymasına rağmen, doğru bakım koşulları hakkında yeterli bilgiye sahip olmadığı için çeşitli zorluklarla karşılaşmaktadır. Biz de bu sorunu çözmek için doğa ile teknolojiyi bir araya getiren akıllı bir danışman sistemi oluşturduk.
                </p>
                <p style={{ marginBottom: '20px' }}>
                  Platformumuz, farklı bitki türlerine özel olarak hazırlanmış detaylı bakım rehberleri sunar. Bu rehberlerde bitkilerin ihtiyaç duyduğu ideal ışık miktarı, nem oranı, sulama sıklığı, toprak yapısı, pH değeri ve gübreleme gereksinimleri gibi kritik bilgiler yer alır. Tüm bu veriler, kullanıcıların kolayca anlayabileceği sade bir dil ve düzenli bir yapı ile sunulmaktadır. Böylece hem bitki bakımına yeni başlayanlar hem de deneyimli kullanıcılar için güvenilir bir kaynak oluşturulmaktadır.
                </p>
                <p style={{ marginBottom: '20px' }}>
                  Akıllı Botanik Danışmanı’nın en önemli hedeflerinden biri, sadece bilgi sunan bir platform olmanın ötesine geçerek kullanıcıya özel çözümler üreten bir sistem haline gelmektir. Bu doğrultuda, kullanıcıların sahip olduğu bitkilere göre kişiselleştirilmiş bakım önerileri sunmayı ve zamanla bu önerileri daha da geliştiren bir yapı kurmayı hedefliyoruz. Gelecekte yapay zeka destekli analizler ile bitkilerin durumuna göre otomatik öneriler sunabilen bir sistem geliştirmeyi planlıyoruz.
                </p>
                <p style={{ marginBottom: '20px' }}>
                  Şu anda web tabanlı olarak hizmet veren platformumuz, ilerleyen süreçte mobil uygulama desteği ile daha geniş bir kullanıcı kitlesine ulaşmayı hedeflemektedir. Aynı zamanda kullanıcıların kendi deneyimlerini paylaşabileceği, bitki bakımı konusunda etkileşim kurabileceği bir topluluk yapısı oluşturmak da planlarımız arasında yer almaktadır.
                </p>
                <p style={{ color: '#4ade80', fontWeight: 'bold' }}>
                  Akıllı Botanik Danışmanı olarak amacımız, bitki bakımını karmaşık ve zor bir süreç olmaktan çıkararak herkes için anlaşılır, uygulanabilir ve keyifli bir deneyime dönüştürmektir. Doğaya olan bağlılığımız ve teknolojiye olan ilgimiz ile, kullanıcılarımıza her zaman daha iyi bir deneyim sunmak için çalışmaya devam ediyoruz.
                </p>
              </div>
              
            </div>
          </div>
        )}

      </div>
    </>
  );
}