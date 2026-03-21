# Интеграция захвата лидов в CRM "АҚ СИСА"

Чтобы заявки с вашего сайта автоматически попадали в CRM и подтягивали аналитику, следуйте этой инструкции.

## 1. Подключение скрипта

Добавьте этот код в секцию `<head>` или перед закрывающим тегом `</body>` на всех страницах вашего сайта:

```html
<script src="https://www.markvision.kz/markvision-tracker.js"></script>
```

## 2. Настройка формы

В обработчик отправки вашей формы (JavaScript) добавьте вызов функции `window.mvSendLead`. 

**Пример для обычной формы:**

```javascript
const myForm = document.getElementById('my-lead-form');

myForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    name: document.getElementById('name').value,
    phone: document.getElementById('phone').value,
    source: 'Главный лендинг' // Можно указать любой источник
  };
  
  // Отправка в CRM
  const result = await window.mvSendLead(formData);
  
  if (result.success) {
    alert('Заявка принята!');
  } else {
    alert('Ошибка. Попробуйте позже.');
  }
});
```

## 3. Что передается автоматически?

Скрипт `markvision-tracker.js` сам соберет и отправит:
- **UTM-метки**: source, medium, campaign, content, term.
- **Технические данные**: URL страницы, Referrer, Разрешение экрана, Браузер.
- **Project ID**: `bf3a691d-2856-43b6-930c-eb346f287c25` (уже вшит в скрипт).

## 4. Как проверить?

1. Перейдите на свой сайт с UTM-меткой (например: `mysite.com/?utm_campaign=test_ai`).
2. Оставьте тестовую заявку.
3. В CRM MarkVision в разделе "Лиды" должна появиться новая запись с вашим именем и меткой `test_ai`.

---
**Важно:** Для того чтобы изменения вступили в силу на стороне MarkVision, необходимо выполнить "Push Deploy" (отправку изменений в репозиторий).
