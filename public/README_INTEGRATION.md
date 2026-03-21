# Инструкция по интеграции сайта с CRM MarkVision

Для проекта: **АҚ СИСА** (ID: `bf3a691d-2856-43b6-930c-eb346f287c25`)

## Шаг 1: Подключение скрипта аналитики
Добавьте следующий код в секцию `<head>` или перед закрывающим тегом `</body>` на каждой странице вашего сайта:

```html
<script src="https://your-domain.com/markvision-tracker.js"></script>
```
*(Замените `your-domain.com` на актуальный домен, где размещен файл)*

## Шаг 2: Настройка отправки форм
Вставьте этот код в обработчик события отправки вашей формы (например, Tilda, WordPress или самописная форма):

```javascript
// Пример для обычной формы
document.querySelector('#my-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: this.querySelector('input[name="name"]').value,
        phone: this.querySelector('input[name="phone"]').value,
        source: 'Сайт', // Или конкретная форма (например, 'Квиз', 'Заявка с футера')
        amount: 0,      // Можно передать сумму, если это корзина
    };

    const result = await window.mvSendLead(formData);
    
    if (result.success) {
        alert('Заявка успешно отправлена!');
        this.reset();
    } else {
        alert('Ошибка при отправке: ' + result.error);
    }
});
```

## Шаг 3: Проверка в n8n
Убедитесь, что ваш вебхук в n8n (`https://n8n.markvision.kz/webhook/client-leads-XYZ`) активен и настроен на прием JSON. 

Скрипт автоматически добавит следующие данные к каждой заявке:
- **UTM-метки** (source, medium, campaign и т.д.)
- **URL страницы**, с которой пришла заявка
- **Referrer** (откуда пришел пользователь)
- **Технические данные** (разрешение экрана, браузер и т.д.)
