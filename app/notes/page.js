'use client';

import { useState } from 'react';
import { Plus, Trash2, Pin, Mic } from 'lucide-react';
import styles from './page.module.css';

export default function Notes() {
  const [notes, setNotes] = useState([
    { id: 1, title: 'Leg Day PRs', content: 'Squat: 315x5, Leg Press: 800x8, RDL: 225x10', pinned: true, date: '2024-08-15' },
    { id: 2, title: 'Shoulder Routine', content: 'OHP: 185x3, Lateral raises: 30x15, Face pulls: 4x15', pinned: false, date: '2024-08-14' },
    { id: 3, title: 'Meal Prep Ideas', content: 'Chicken + rice + broccoli, Steak + sweet potato, Salmon + quinoa', pinned: false, date: '2024-08-13' },
  ]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [showForm, setShowForm] = useState(false);

  const addNote = () => {
    if (!newNote.title) return;
    setNotes([{ id: Date.now(), ...newNote, pinned: false, date: new Date().toISOString().slice(0,10) }, ...notes]);
    setNewNote({ title: '', content: '' });
    setShowForm(false);
  };

  const deleteNote = (id) => setNotes(notes.filter(n => n.id !== id));
  const togglePin = (id) => setNotes(notes.map(n => n.id === id ? {...n, pinned: !n.pinned} : n));

  const sorted = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Workout <span className={styles.gradient}>Notes</span></h1>
          <button className={styles.newBtn} onClick={() => setShowForm(!showForm)}>
            <Plus size={18} /> New Note
          </button>
        </div>

        {showForm && (
          <div className={styles.form}>
            <input 
              type="text" 
              placeholder="Note title..." 
              value={newNote.title}
              onChange={e => setNewNote({...newNote, title: e.target.value})}
            />
            <textarea 
              placeholder="Write your notes here..." 
              rows={4}
              value={newNote.content}
              onChange={e => setNewNote({...newNote, content: e.target.value})}
            />
            <div className={styles.formActions}>
              <button className={styles.micBtn}><Mic size={16} /> Voice</button>
              <div className={styles.formRight}>
                <button className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                <button className={styles.saveBtn} onClick={addNote}>Save Note</button>
              </div>
            </div>
          </div>
        )}

        <div className={styles.notesGrid}>
          {sorted.map(note => (
            <div key={note.id} className={`${styles.note} ${note.pinned ? styles.pinned : ''}`}>
              <div className={styles.noteHeader}>
                <h3>{note.title}</h3>
                <div className={styles.noteActions}>
                  <button onClick={() => togglePin(note.id)} className={note.pinned ? styles.pinnedBtn : ''}>
                    <Pin size={14} />
                  </button>
                  <button onClick={() => deleteNote(note.id)} className={styles.deleteBtn}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className={styles.noteContent}>{note.content}</p>
              <span className={styles.noteDate}>{note.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
