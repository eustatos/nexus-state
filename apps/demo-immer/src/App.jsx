import React from 'react';
import { atom, createStore } from '@nexus-state/core';
import { immerAtom } from '@nexus-state/immer';

// Создаем хранилище
const store = createStore();

// Создаем атом с использованием Immer для управления сложным состоянием
const userStateAtom = immerAtom({
  profile: {
    personal: {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      contacts: {
        email: 'john.doe@example.com',
        phone: '+1234567890'
      }
    },
    preferences: {
      theme: 'light',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  posts: [
    {
      id: 1,
      title: 'Первый пост',
      content: 'Содержание первого поста',
      tags: ['привет', 'мир'],
      createdAt: new Date('2023-01-01')
    }
  ],
  friends: [
    { id: 1, name: 'Alice', online: true },
    { id: 2, name: 'Bob', online: false }
  ]
});

export const App = () => {
  const userState = store.get(userStateAtom);

  // Функции для обновления состояния с использованием Immer
  const updateFirstName = (newName) => {
    store.set(userStateAtom, (draft) => {
      draft.profile.personal.firstName = newName;
    });
  };

  const addTagToFirstPost = (tag) => {
    store.set(userStateAtom, (draft) => {
      if (draft.posts.length > 0) {
        draft.posts[0].tags.push(tag);
      }
    });
  };

  const addFriend = (friend) => {
    store.set(userStateAtom, (draft) => {
      draft.friends.push(friend);
    });
  };

  const toggleEmailNotifications = () => {
    store.set(userStateAtom, (draft) => {
      draft.profile.preferences.notifications.email = !draft.profile.preferences.notifications.email;
    });
  };

  const updateEmail = (newEmail) => {
    store.set(userStateAtom, (draft) => {
      draft.profile.personal.contacts.email = newEmail;
    });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Nexus State Immer Demo</h1>
      <p>Демонстрация работы с Immer для управления сложным состоянием</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
          <h2>Текущее состояние</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '300px' }}>
            {JSON.stringify(userState, null, 2)}
          </pre>
        </div>
        
        <div>
          <h2>Операции с состоянием</h2>
          
          <div style={{ marginBottom: '15px' }}>
            <h3>Обновление имени</h3>
            <button onClick={() => updateFirstName('Jane')} style={{ marginRight: '10px' }}>
              Установить имя Jane
            </button>
            <button onClick={() => updateFirstName('John')}>
              Установить имя John
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3>Работа с постами</h3>
            <button onClick={() => addTagToFirstPost('новый тег')} style={{ marginRight: '10px' }}>
              Добавить тег к первому посту
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3>Работа с друзьями</h3>
            <button onClick={() => addFriend({ id: 3, name: 'Charlie', online: true })}>
              Добавить друга Charlie
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3>Настройки уведомлений</h3>
            <button onClick={toggleEmailNotifications}>
              Переключить email уведомления
            </button>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <h3>Обновление email</h3>
            <button onClick={() => updateEmail('new.email@example.com')}>
              Обновить email
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e8f4fd', borderRadius: '4px' }}>
        <h3>Преимущества использования Immer:</h3>
        <ul>
          <li>Иммутабельные обновления с мутирующим синтаксисом</li>
          <li>Автоматическое создание новых объектов при изменениях</li>
          <li>Удобная работа со сложными вложенными структурами</li>
          <li>Лучшая производительность по сравнению с ручным spread оператором</li>
        </ul>
      </div>
    </div>
  );
};