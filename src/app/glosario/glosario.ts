import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// --- Firebase Imports ---
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, User
} from "firebase/auth";
import { 
  getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc
} from "firebase/firestore";

// --- Configuración ---
const firebaseConfig = {
  apiKey: "AIzaSyDRviDPYGBpURT0r2_l6_LBJtF91ITwvMI",
  authDomain: "glosario-d6bc3.firebaseapp.com",
  projectId: "glosario-d6bc3",
  storageBucket: "glosario-d6bc3.firebasestorage.app",
  messagingSenderId: "786251394798",
  appId: "1:786251394798:web:7e1e08242743c53f218dff",
  measurementId: "G-HJGVEZQ8K1"
};
const ADMIN_PASSWORD = "triana";
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "1:786251394798:web:7e1e08242743c53f218dff";

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
  templateUrl: './glosario.html'
})
export class AppComponent implements OnInit {
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

  // --- Computed ---
  availableSubjects = computed(() => {
    const subs = new Set(this.terms().map(t => t.subject).filter(Boolean));
    return Array.from(subs).sort();
  });

  filteredTerms = computed(() => {
    const s = this.searchTerm().toLowerCase();
    return this.terms().filter(t => {
      const matchLang = this.filterLang() === 'all' || t.lang === this.filterLang();
      const matchCourse = this.filterCourse() === 'all' || t.course === this.filterCourse();
      const matchSubject = this.filterSubject() === 'all' || t.subject === this.filterSubject();
      const matchSearch = t.term.toLowerCase().includes(s) || t.translation.toLowerCase().includes(s);
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
    const q = collection(db, 'artifacts', appId, 'users', uid, 'glossary_terms');
    onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Term));
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
      const col = collection(db, 'artifacts', appId, 'users', this.user()!.uid, 'glossary_terms');
      const base = {
        lang: this.newTerm.lang,
        course: this.newTerm.course,
        subject: this.newTerm.subject.toLowerCase(),
        createdAt: Date.now()
      };
      if (this.addMode() === 'single') {
        if (!this.newTerm.term) return;
        await addDoc(col, { ...base, term: this.newTerm.term, translation: this.newTerm.translation });
      } else {
        const lines = this.bulkText().split('\n');
        for (const line of lines) {
          if (line.includes(';')) {
            const [t, tr] = line.split(';').map(s => s.trim());
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

  async handleDelete(id: string) {
    if (confirm('¿Borrar?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', this.user()!.uid, 'glossary_terms', id));
    }
  }

  // --- Aquí van tus funciones de IA (handleAIDefine, generateContent, handleTTS, etc.) ---
}
