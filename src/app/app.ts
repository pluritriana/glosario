import { Component, OnInit, OnDestroy, computed, signal, effect, inject } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { bootstrapApplication } from '@angular/platform-browser';
import { environment } from '../environments/environment';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithCustomToken,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';

// --- Configuración ---
const firebaseConfig = {
  apiKey: 'AIzaSyDRviDPYGBpURT0r2_l6_LBJtF91ITwvMI',
  authDomain: 'glosario-d6bc3.firebaseapp.com',
  projectId: 'glosario-d6bc3',
  storageBucket: 'glosario-d6bc3.firebasestorage.app',
  messagingSenderId: '786251394798',
  appId: '1:786251394798:web:7e1e08242743c53f218dff',
  measurementId: 'G-HJGVEZQ8K1',
};
const apiKeyGeminis = environment.apiKey;
const ADMIN_PASSWORD = 'Triana0??';
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = '1:786251394798:web:7e1e08242743c53f218dff';

// --- Interfaces ---
interface Term {
  id: string;
  term: string;
  translation: string;
  lang: string;
  course: string;
  subject: string;
  createdAt: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
})
export class App implements OnInit {
  // --- Signals ---
  user = signal<User | null>(null);
  terms = signal<Term[]>([]);
  activeTab = signal<'glosario' | 'practica' | 'add'>('glosario');

  // Filtros
  filterLang = signal('all');
  filterCourse = signal('all');
  filterSubject = signal('all');
  searchTerm = signal('');

  // Añadir
  addMode = signal<'single' | 'bulk'>('single');
  newTerm = { term: '', translation: '', lang: 'en', course: '1eso', subject: '' };
  bulkText = signal('');
  isNewSubject = signal(false);
  passwordInput = signal('');
  saving = signal(false);

  // IA
  modalOpen = signal(false);
  modalContent = signal<string>('');
  loadingAI = signal(false);
  loadingQuiz = signal(false);
  quizResult = signal<string>('');

  deleteModalOpen = signal(false);
  termToDeleteId = signal<string | null>(null);
  deletePasswordInput = signal('');

  // --- Computed ---
  availableSubjects = computed(() => {
    const subs = new Set(
      this.terms()
        .map((t) => t.subject.toUpperCase())
        .filter(Boolean),
    );
    return Array.from(subs).sort();
  });

  filteredTerms = computed(() => {
    const s = this.searchTerm().toLowerCase();
    return this.terms().filter((t) => {
      const matchLang = this.filterLang() === 'all' || t.lang === this.filterLang();
      const matchCourse = this.filterCourse() === 'all' || t.course === this.filterCourse();
      const matchSubject = this.filterSubject() === 'all' || t.subject === this.filterSubject();
      const matchSearch =
        t.term.toLowerCase().includes(s) || t.translation.toLowerCase().includes(s);
      return matchLang && matchCourse && matchSubject && matchSearch;
    });
  });

  ngOnInit() {
    this.initAuth();
  }

  async initAuth() {
    await signInAnonymously(auth);

    onAuthStateChanged(auth, (u) => {
      this.user.set(u);
      if (u) this.loadData(u.uid);
    });
  }

  loadData(uid: string) {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'glossary_terms');
    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as Term);
      this.terms.set(data.sort((a, b) => b.createdAt - a.createdAt));
    });
  }

  checkNewSubject(e: any) {
    if (e.target.value === 'new') {
      this.isNewSubject.set(true);
      this.newTerm.subject = '';
    }
  }

  async handleSave() {
    if (this.passwordInput() !== ADMIN_PASSWORD) {
      alert('⚠️ Contraseña incorrecta');
      return;
    }
    if (!this.user()) return;
    this.saving.set(true);

    try {
      const col = collection(db, 'artifacts', appId, 'public', 'data', 'glossary_terms');
      const base = {
        lang: this.newTerm.lang,
        course: this.newTerm.course,
        subject: this.newTerm.subject.toUpperCase(),
        createdAt: Date.now(),
      };
      if (this.addMode() === 'single') {
        if (!this.newTerm.term) return;
        await addDoc(col, {
          ...base,
          term: this.newTerm.term,
          translation: this.newTerm.translation,
        });
      } else {
        const lines = this.bulkText().split('\n');
        for (const line of lines) {
          if (line.includes(';')) {
            const [t, tr] = line.split(';').map((s) => s.trim());
            await addDoc(col, { ...base, term: t, translation: tr });
          }
        }
      }
      this.newTerm.term = '';
      this.newTerm.translation = '';
      this.bulkText.set('');
      this.passwordInput.set('');
      this.activeTab.set('glosario');
      alert('Guardado correctamente');
    } catch (e) {
      console.error(e);
      alert('Error al guardar');
    } finally {
      this.saving.set(false);
    }
  }

  handleDelete(id: string) {
    this.termToDeleteId.set(id);
    this.deletePasswordInput.set('');
    this.deleteModalOpen.set(true);
  }

  async confirmDelete() {
    if (this.deletePasswordInput() !== ADMIN_PASSWORD) {
      alert('⚠️ Contraseña incorrecta');
      return;
    }

    if (this.termToDeleteId()) {
      try {
        await deleteDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'glossary_terms', this.termToDeleteId()!),
        );
        this.deleteModalOpen.set(false);
        this.termToDeleteId.set(null);
      } catch (e) {
        console.error(e);
        alert('Error al borrar');
      }
    }
  }

  // --- Aquí van tus funciones de IA (handleAIDefine, generateContent, handleTTS, etc.) ---
  // --- IA Functions ---

  async generateContent(prompt: string) {
    try {
      const res = await fetch(`https://gemini-backend-lime.vercel.app/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt }), // Enviamos el prompt al backend
      });

      const data = await res.json();

      // El backend devuelve { respuesta: "..." }
      if (data.respuesta) {
        return data.respuesta;
      } else {
        console.error('Error del backend:', data.error);
        return 'Error al obtener respuesta de la IA';
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      return 'Error de conexión con el servidor';
    }
  }

  async handleAIDefine(term: Term) {
    this.modalOpen.set(true);
    this.loadingAI.set(true);
    console.log(term.lang);
    const p =
      "Define muy resumido el término '" +
      term.term +
      "' en el idioma: " +
      term.lang +
      ' (en significa inglés, y fr significa frances) para un estudiante de ' +
      term.subject +
      ' del curso ' +
      term.course +
      '. HTML simple (<h3>, <p>, <br>).';
    const txt = await this.generateContent(p);
    this.modalContent.set(txt);
    this.loadingAI.set(false);
  }

  async handleGenerateQuiz() {
    if (this.filteredTerms().length < 3) {
      alert('Necesitas al menos 3 términos filtrados');
      return;
    }
    this.loadingQuiz.set(true);
    const sample = this.filteredTerms()
      .slice(0, 10)
      .map((t) => `${t.term} (${t.translation})`)
      .join(', ');
    //const p = `Crea un quiz HTML de 3 preguntas basado en: ${sample}. Formato: <div><strong>Pregunta</strong><ul><li>Opciones</li></ul><details><summary>Ver respuesta</summary>Respuesta...</details></div>`;
    const p = `Actúa como un profesor de idiomas experto y generador de contenido web. Crea un quiz de 10 preguntas de vocabulario para estos términos: ${sample} .Requisitos técnicos: Entrega el resultado exclusivamente en código HTML (sin bloques de código de programación, solo las etiquetas <div>, <h3>, <p>, <ul>, etc.). Usa una estructura limpia: Título del quiz en <h2>, cada pregunta dentro de un <div> con clase 'pregunta', y las opciones en una lista desordenada <ul>. El formato debe ser 'rellenar huecos' (____) con opciones A, B y C. Estructura del contenido: Las 10 preguntas primero. El título de las preguntas en negrita <b>. Una línea separadora <hr>. Una sección final con las respuestas correctas y una breve explicación para cada una. Deben de ser dos quiz, uno en inglés y otro en francés`;
    const res = await this.generateContent(p);
    this.quizResult.set(res);
    this.loadingQuiz.set(false);
  }

  async handleTTS(text: string, lang: string) {
    try {
      // Llamada a tu propio backend en Vercel
      const res = await fetch('https://gemini-backend-lime.vercel.app/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang }), // Enviamos texto e idioma
      });

      const audioData = await res.json();

      if (!res.ok || !audioData || !audioData.data) {
        console.warn('Error en el backend de TTS:', audioData);
        this.fallbackTTS(text, lang);
        return;
      }

      // Procesamiento del audio (tu lógica original)
      const mimeType = audioData.mimeType || '';
      const rateMatch = mimeType.match(/rate=(\d+)/);
      const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;

      console.log(`Reproduciendo audio desde backend a ${sampleRate}Hz`);

      const binary = atob(audioData.data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const wav = this.pcmToWav(bytes, sampleRate);
      const audio = new Audio(URL.createObjectURL(wav));
      audio.play();
    } catch (e) {
      console.error('TTS System Error:', e);
      this.fallbackTTS(text, lang);
    }
  }

  fallbackTTS(text: string, lang: string) {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta lectura de texto.');
      return;
    }

    // Cancelar lecturas anteriores para evitar solapamientos
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Intentar ajustar el idioma al del término (o fallback a inglés británico/francés de Francia)
    utterance.lang = lang === 'fr' ? 'fr-FR' : 'en-GB';

    console.log(`Usando navegador TTS (Fallback) para: ${text} (${utterance.lang})`);
    window.speechSynthesis.speak(utterance);
  }

  pcmToWav(pcmData: Uint8Array, sampleRate: number) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const wavData = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(wavData);

    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + pcmData.length, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, pcmData.length, true);

    const pcmBytes = new Uint8Array(wavData, 44);
    pcmBytes.set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
  }

  writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
