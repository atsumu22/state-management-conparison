'use client';

import React, { useState } from 'react';
import { BookOpen, X, Smile, Send, Pencil, Trash2, ChevronLeft, Mail, Lock, User, Copy, Check, Settings, LogOut } from 'lucide-react';

export default function ExchangeDiaryApp() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'signup', 'invite', 'calendar', 'diary-list', 'diary-detail', 'settings'
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [writeDate, setWriteDate] = useState('');
  const [diaryText, setDiaryText] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false);
  const [inviteMode, setInviteMode] = useState(null); // 'generate' or 'enter'
  
  // サンプルデータ
  const userColor = '#be185d'; // rose-700
  const partnerColor = '#1e40af'; // blue-800
  const remainingChars = 400 - diaryText.length;
  const currentMonth = '2026年3月';
  const userName = 'あなた';
  const partnerName = 'パートナー';
  const inviteCode = 'A3F2B9C1';
  
  // カレンダー用のダミーデータ
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const myDiaryDays = [5, 12, 18, 25];
  
  // 日記帳の月リスト
  const diaryMonths = [
    { month: '2026年2月', count: 15 },
    { month: '2026年1月', count: 23 },
    { month: '2025年12月', count: 18 }
  ];
  
  // 月別詳細の日記データ
  const monthDiaries = {
    '2026年2月': [
      { date: '2月1日', entries: [
        { author: 'あなた', authorType: 'me', time: '10:00', text: '新しい月が始まった。今月も頑張ろう。', stamps: [{ emoji: '💪', user: 'パートナー' }] }
      ]},
      { date: '2月3日', entries: [
        { author: 'パートナー', authorType: 'partner', time: '09:00', text: '朝ごはんが美味しかった。', stamps: [{ emoji: '😊', user: 'あなた' }] },
        { author: 'あなた', authorType: 'me', time: '22:00', text: '今日は疲れた...', stamps: [] }
      ]}
    ],
    '2026年1月': [
      { date: '1月15日', entries: [
        { author: 'あなた', authorType: 'me', time: '10:00', text: '朝、イライラした。洗い物が溜まっていて...', stamps: [{ emoji: '❤️', user: 'パートナー' }] },
        { author: 'パートナー', authorType: 'partner', time: '14:00', text: '今日は楽しかった。久しぶりに散歩できて良かった。', stamps: [] }
      ]}
    ],
    '2025年12月': [
      { date: '12月25日', entries: [
        { author: 'パートナー', authorType: 'partner', time: '09:00', text: 'メリークリスマス！今日は特別な日だね。', stamps: [{ emoji: '🎄', user: 'あなた' }] },
        { author: 'あなた', authorType: 'me', time: '22:00', text: '素敵な一日だった。ありがとう。', stamps: [{ emoji: '❤️', user: 'パートナー' }] }
      ]}
    ]
  };
  
  const emojis = ['❤️', '👍', '😊', '🎉', '💕', '✨', '🌸', '☕'];

  const handleDateClick = (day) => {
    if (myDiaryDays.includes(day)) {
      setWriteDate(`3月${day}日`);
      setDiaryText('朝、イライラした。洗い物が溜まっていて...');
      setEditMode(true);
      setShowWriteModal(true);
    } else {
      setWriteDate(`3月${day}日`);
      setDiaryText('');
      setEditMode(false);
      setShowWriteModal(true);
    }
  };

  const handleCopyCode = () => {
    setInviteCodeCopied(true);
    setTimeout(() => setInviteCodeCopied(false), 2000);
  };

  // ログイン画面
  const LoginView = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-12">
            <div className="text-6xl mb-4">📔</div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">やさしい交換日記</h1>
            <p className="text-gray-600 text-sm">時間が優しくしてくれる、ふたりの記録</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="password"
                  placeholder="パスワード"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                />
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('calendar')}
              className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition shadow-md"
            >
              ログイン
            </button>
            
            <button 
              onClick={() => setCurrentView('signup')}
              className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition shadow-sm"
            >
              新規登録
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ユーザー登録画面
  const SignupView = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100">
      <div className="p-4">
        <button onClick={() => setCurrentView('login')} className="text-gray-600 hover:text-gray-800 transition">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">アカウント作成</h2>
            <p className="text-gray-600 text-sm">新しい記録を始めましょう</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="text"
                  placeholder="お名前"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="email"
                  placeholder="メールアドレス"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                />
              </div>
            </div>
            
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                <input
                  type="password"
                  placeholder="パスワード（8文字以上）"
                  className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 placeholder-gray-400 focus:border-rose-400 focus:outline-none shadow-sm transition"
                />
              </div>
            </div>
            
            <button 
              onClick={() => setCurrentView('invite')}
              className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition shadow-md"
            >
              登録する
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // パートナー招待画面
  const InviteView = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-rose-100 via-pink-50 to-blue-100">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {!inviteMode ? (
            <>
              <div className="text-center mb-12">
                <div className="text-6xl mb-4">💌</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">パートナーと繋がる</h2>
                <p className="text-gray-600 text-sm">ふたりで記録を共有しましょう</p>
              </div>
              
              <div className="space-y-4">
                <button 
                  onClick={() => setInviteMode('generate')}
                  className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-lg hover:border-rose-300 transition group"
                >
                  <div className="text-4xl mb-2">📨</div>
                  <div className="text-gray-800 font-bold text-lg mb-1">招待コードを生成</div>
                  <div className="text-gray-500 text-sm">パートナーを招待する</div>
                </button>
                
                <button 
                  onClick={() => setInviteMode('enter')}
                  className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-lg hover:border-blue-300 transition group"
                >
                  <div className="text-4xl mb-2">🔑</div>
                  <div className="text-gray-800 font-bold text-lg mb-1">招待コードを入力</div>
                  <div className="text-gray-500 text-sm">招待を受ける</div>
                </button>
                
                <button 
                  onClick={() => setCurrentView('calendar')}
                  className="w-full py-4 text-gray-500 hover:text-gray-700 transition font-medium"
                >
                  あとで設定する
                </button>
              </div>
            </>
          ) : inviteMode === 'generate' ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">招待コード</h2>
                <p className="text-gray-600 text-sm">このコードをパートナーに共有してください</p>
              </div>
              
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 mb-6 shadow-lg">
                <div className="text-center mb-6">
                  <div className="text-5xl font-mono font-bold text-gray-800 tracking-widest mb-2">
                    {inviteCode}
                  </div>
                  <div className="text-gray-500 text-xs">有効期限: 7日間</div>
                </div>
                
                <button 
                  onClick={handleCopyCode}
                  className="w-full py-3 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-xl hover:shadow-lg transition flex items-center justify-center gap-2"
                >
                  {inviteCodeCopied ? (
                    <>
                      <Check className="w-5 h-5" />
                      コピーしました
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      コードをコピー
                    </>
                  )}
                </button>
              </div>
              
              <button 
                onClick={() => setCurrentView('calendar')}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-2xl hover:bg-gray-50 transition"
              >
                完了
              </button>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">招待コードを入力</h2>
                <p className="text-gray-600 text-sm">パートナーから受け取ったコードを入力</p>
              </div>
              
              <div className="space-y-6">
                <input
                  type="text"
                  placeholder="A3F2B9C1"
                  className="w-full px-4 py-5 bg-white border-2 border-gray-200 rounded-2xl text-gray-800 text-center text-3xl font-mono font-bold tracking-widest placeholder-gray-300 focus:border-rose-400 focus:outline-none shadow-sm transition uppercase"
                  maxLength={8}
                />
                
                <button 
                  onClick={() => setCurrentView('calendar')}
                  className="w-full py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold rounded-2xl hover:shadow-lg transition shadow-md"
                >
                  接続する
                </button>
                
                <button 
                  onClick={() => setInviteMode(null)}
                  className="w-full py-3 text-gray-500 hover:text-gray-700 transition font-medium"
                >
                  戻る
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // カレンダービュー
  const CalendarView = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-rose-50 to-blue-50">
      <div className="bg-gradient-to-r from-rose-100 to-blue-100 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">{currentMonth}</h2>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentView('diary-list')}
              className="bg-white p-3 rounded-xl hover:shadow-lg transition shadow-md border border-gray-200"
            >
              <BookOpen className="w-6 h-6 text-rose-500" />
            </button>
            <button 
              onClick={() => setCurrentView('settings')}
              className="bg-white p-3 rounded-xl hover:shadow-lg transition shadow-md border border-gray-200"
            >
              <Settings className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
            <div key={day} className={`text-center text-sm font-bold py-3 ${idx === 0 ? 'text-rose-500' : idx === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {daysInMonth.map(day => (
            <div 
              key={day} 
              onClick={() => handleDateClick(day)}
              className="aspect-square rounded-2xl p-3 hover:shadow-xl transition-all cursor-pointer bg-white border-2 border-gray-200 hover:border-rose-300 hover:-translate-y-1"
            >
              <div className="text-lg font-bold text-gray-700 mb-1">{day}</div>
              {myDiaryDays.includes(day) && (
                <div 
                  className="w-4 h-4 rounded-full shadow-lg"
                  style={{ backgroundColor: userColor }}
                ></div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400 font-medium">
          ← 日記帳を見る
        </div>
      </div>
    </div>
  );

  // 日記帳ビュー（トップ）
  const DiaryListView = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <span>📖</span> 日記帳
          </h2>
          <button 
            onClick={() => setCurrentView('calendar')}
            className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {diaryMonths.map((item, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelectedMonth(item.month);
                setCurrentView('diary-detail');
              }}
              className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all cursor-pointer border-2 border-amber-200 hover:border-amber-400 hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📔</div>
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    {item.month}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {item.count}件の日記
                  </div>
                </div>
                <div className="text-gray-300 group-hover:text-gray-400 transition">
                  <ChevronLeft className="w-8 h-8 rotate-180" />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-400 font-medium">
          カレンダーに戻る →
        </div>
      </div>
    </div>
  );

  // 日記帳ビュー（月別詳細）
  const DiaryDetailView = () => (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(to bottom, #fef3c7, #fef9e3)' }}>
      <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 p-6 shadow-xl flex items-center gap-4">
        <button 
          onClick={() => setCurrentView('diary-list')} 
          className="bg-white/20 backdrop-blur-sm p-3 rounded-xl hover:bg-white/30 transition"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h2 className="text-2xl font-bold text-white">{selectedMonth}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {monthDiaries[selectedMonth]?.map((dayData, idx) => (
            <div key={idx} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                <div className="px-6 py-2 bg-white rounded-full border-2 border-amber-400 shadow-lg">
                  <span className="text-sm font-bold text-amber-900">{dayData.date}</span>
                </div>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
              </div>
              
              {dayData.entries.map((entry, entryIdx) => (
                <div 
                  key={entryIdx} 
                  className="mb-6 bg-white rounded-2xl p-6 shadow-xl border-l-4 border-amber-500 hover:shadow-2xl transition-shadow"
                >
                  <div className="flex items-baseline gap-3 mb-4">
                    <span className="font-bold text-gray-800 text-xl">{entry.author}</span>
                    <span className="text-xs text-gray-400 font-mono">{entry.time}</span>
                  </div>
                  <p 
                    className="text-gray-700 mb-5 leading-relaxed text-lg"
                    style={{ 
                      fontFamily: entry.authorType === 'me' 
                        ? "'Noto Serif JP', serif" 
                        : "'Noto Sans JP', sans-serif"
                    }}
                  >
                    {entry.text}
                  </p>
                  
                  {entry.stamps.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {entry.stamps.map((stamp, stampIdx) => (
                        <span key={stampIdx} className="text-sm bg-amber-100 px-4 py-2 rounded-full border border-amber-300 font-medium">
                          {stamp.emoji} {stamp.user}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="relative">
                    <button 
                      onClick={() => setShowEmojiPicker(showEmojiPicker === `${idx}-${entryIdx}` ? null : `${idx}-${entryIdx}`)}
                      className="text-sm text-amber-700 hover:text-amber-800 flex items-center gap-2 font-bold px-4 py-2 bg-amber-50 rounded-xl hover:bg-amber-100 transition"
                    >
                      <Smile className="w-4 h-4" />
                      スタンプを送る
                    </button>
                    
                    {showEmojiPicker === `${idx}-${entryIdx}` && (
                      <div className="absolute top-12 left-0 bg-white border-2 border-amber-300 rounded-2xl p-4 shadow-2xl z-10 grid grid-cols-4 gap-3">
                        {emojis.map((emoji, emojiIdx) => (
                          <button 
                            key={emojiIdx}
                            onClick={() => setShowEmojiPicker(null)}
                            className="text-3xl hover:bg-amber-50 p-3 rounded-xl transition hover:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 設定画面
  const SettingsView = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-rose-50 to-blue-50">
      <div className="bg-gradient-to-r from-rose-100 to-blue-100 p-6 shadow-lg flex items-center gap-4">
        <button 
          onClick={() => setCurrentView('calendar')} 
          className="bg-white p-3 rounded-xl hover:shadow-lg transition shadow-md border border-gray-200"
        >
          <ChevronLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800">設定</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="text-sm text-gray-500 mb-2">お名前</div>
            <div className="text-xl font-bold text-gray-800">{userName}</div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="text-sm text-gray-500 mb-2">カラー</div>
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full shadow-lg" style={{ backgroundColor: userColor }}></div>
              <div className="w-12 h-12 rounded-full shadow-lg bg-gray-300"></div>
              <div className="w-12 h-12 rounded-full shadow-lg bg-blue-600"></div>
              <div className="w-12 h-12 rounded-full shadow-lg bg-emerald-600"></div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
            <div className="text-sm text-gray-500 mb-2">パートナー</div>
            <div className="text-xl font-bold text-gray-800 mb-4">{partnerName}</div>
            <button className="text-sm text-red-600 hover:text-red-700 font-semibold">
              接続を解除
            </button>
          </div>
          
          <button 
            onClick={() => setCurrentView('login')}
            className="w-full py-4 bg-white rounded-2xl shadow-lg border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            ログアウト
          </button>
        </div>
      </div>
    </div>
  );

  // 書く・編集画面モーダル
  const WriteModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl border-4 border-rose-200">
        {editMode ? (
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-rose-100 to-blue-100 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800">{writeDate}の日記</h3>
                <button onClick={() => setShowWriteModal(false)} className="text-gray-600 hover:text-gray-800 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="bg-rose-50 rounded-2xl p-6 border-2 border-rose-200">
                <p className="text-gray-800 mb-4 leading-relaxed text-lg">{diaryText}</p>
                <div className="text-xs text-rose-600 mb-6 flex items-center gap-2 font-semibold">
                  🔒 4月1日に公開されます
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-gradient-to-r from-rose-400 to-pink-500 text-white py-3 px-4 rounded-xl font-bold hover:shadow-lg transition flex items-center justify-center gap-2"
                  >
                    <Pencil className="w-4 h-4" />
                    編集
                  </button>
                  <button className="flex-1 bg-white border-2 border-red-300 text-red-600 py-3 px-4 rounded-xl font-bold hover:bg-red-50 transition flex items-center justify-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="bg-gradient-to-r from-rose-100 to-blue-100 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800">{writeDate}の日記を書く</h3>
                <button onClick={() => setShowWriteModal(false)} className="text-gray-600 hover:text-gray-800 transition">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="text-sm text-gray-600">
                あと <span className="font-bold text-rose-600">{remainingChars}</span> 文字
              </div>
            </div>
            
            <div className="flex-1 p-6 overflow-y-auto">
              <textarea
                value={diaryText}
                onChange={(e) => e.target.value.length <= 400 && setDiaryText(e.target.value)}
                placeholder="今日の気持ちを書いてみましょう..."
                className="w-full h-full min-h-[200px] p-4 border-2 border-gray-200 rounded-2xl focus:border-rose-400 focus:outline-none resize-none text-lg"
              />
            </div>
            
            <div className="p-6 border-t-2 border-gray-100">
              <button 
                onClick={() => {
                  setShowWriteModal(false);
                  setDiaryText('');
                }}
                className="w-full bg-gradient-to-r from-rose-400 to-pink-500 text-white py-4 rounded-2xl font-bold hover:shadow-lg transition shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full h-screen max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {currentView === 'login' && <LoginView />}
      {currentView === 'signup' && <SignupView />}
      {currentView === 'invite' && <InviteView />}
      {currentView === 'calendar' && <CalendarView />}
      {currentView === 'diary-list' && <DiaryListView />}
      {currentView === 'diary-detail' && <DiaryDetailView />}
      {currentView === 'settings' && <SettingsView />}
      {showWriteModal && <WriteModal />}
    </div>
  );
}