const addBtn = document.getElementById('addBtn')
const descInput = document.getElementById('desc')
const amountInput = document.getElementById('amount')
const categorySelect = document.getElementById('category')
const dateInput = document.getElementById('date')
const txList = document.getElementById('txList')
const incomeBtn = document.getElementById('incomeBtn')
const expenseBtn = document.getElementById('expenseBtn')
const searchInput = document.getElementById('searchInput')
const typeFilter = document.getElementById('typeFilter')
const categoryFilter = document.getElementById('categoryFilter')
const sortPills = document.querySelectorAll('.sort-pill')
const refreshBtn = document.querySelector('.refresh-btn')

let transactions = JSON.parse(localStorage.getItem('transactions')) || []
let currentType = 'income'
let activeSort = 'newest'
const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
const newsData = [
    { tag: "Markets", title: "Sensex surges 400 pts as FII inflows hit 3-month high", src: "Economic Times · 2h ago" },
    { tag: "RBI", title: "RBI keeps repo rate unchanged at 6.5% in June policy", src: "Mint · 5h ago" },
    { tag: "Crypto", title: "Bitcoin crosses $70K mark for first time in 2026", src: "CoinDesk · 8h ago" },
    { tag: "Savings", title: "High-yield savings accounts see record deposits", src: "Bloomberg · 12h ago" }
]

const financeTips = [
    "Follow the 50/30/20 rule — spend 50% on needs, 30% on wants, and save 20%.",
    "Track every expense for 30 days. Small costs add up fast.",
    "Build an emergency fund covering 3-6 months of expenses.",
    "Pay yourself first — save before you spend.",
    "Wait 48 hours before any non-essential purchase."
]

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions))
}


addBtn.addEventListener('click', function() {
    const desc = descInput.value.trim()
    const amount = parseFloat(amountInput.value)
    const category = categorySelect.value
    const date = dateInput.value

    if (!desc || isNaN(amount) || amount <= 0 || !date) {
        alert('Please fill all fields correctly!')
        return
    }
    const newTransaction = {
        id: Date.now(),
        desc: desc,
        amount: amount,
        category: category,
        date: date,
        type: currentType
    }

    transactions.push(newTransaction)
    saveTransactions()
    updateDashboard()
    descInput.value = ''
    amountInput.value = ''
    dateInput.value = ''
})

incomeBtn.addEventListener('click', function() {
    currentType = 'income'
    incomeBtn.classList.add('inc-active')
    expenseBtn.classList.remove('exp-active')
})

expenseBtn.addEventListener('click', function() {
    currentType = 'expense'
    expenseBtn.classList.add('exp-active')
    incomeBtn.classList.remove('inc-active')
})

searchInput.addEventListener('input', renderTransactions)
typeFilter.addEventListener('change', renderTransactions)
categoryFilter.addEventListener('change', renderTransactions)

function renderTransactions() {
    txList.innerHTML = ''

    const searchTerm = searchInput.value.toLowerCase()
    const selectedType = typeFilter.value
    const selectedCategory = categoryFilter.value

    const filtered = transactions.filter(function(tx) {
        const matchesSearch = tx.desc.toLowerCase().includes(searchTerm)
        const matchesType = selectedType === 'all' || tx.type === selectedType
        const matchesCategory = selectedCategory === 'all' || tx.category === selectedCategory
        return matchesSearch && matchesType && matchesCategory
})

      filtered.sort(function(a, b) {
    if (activeSort === 'newest') return new Date(b.date) - new Date(a.date)
    if (activeSort === 'oldest') return new Date(a.date) - new Date(b.date)
    if (activeSort === 'high') return b.amount - a.amount
    if (activeSort === 'low') return a.amount - b.amount
})
    

    filtered.forEach(function(tx) {
        const isIncome = tx.type === 'income'
        txList.innerHTML += `
            <div class="tx-item">
                <div class="tx-icon ${isIncome ? 'inc' : 'exp'}">
                    <i class="ti ti-arrow-${isIncome ? 'up' : 'down'}"></i>
                </div>
                <div class="tx-info">
                    <div class="tx-desc">${tx.desc}</div>
                    <div class="tx-meta">${tx.category}</div>
                </div>
                <div class="tx-right">
                    <div class="tx-amt ${isIncome ? 'inc' : 'exp'}">${isIncome ? '+' : '-'}₹${tx.amount}</div>
                    <div class="tx-date">${tx.date}</div>
                </div>
                <button class="del-btn" onclick="deleteTransaction(${tx.id})">
                    <i class="ti ti-trash"></i>
                </button>
            </div>
        `
    })
}
function deleteTransaction(id) {
    transactions = transactions.filter(function(tx) {
        return tx.id !== id
    })
    saveTransactions()
    updateDashboard()
}
function updateDashboard() {
    let totalIncome = 0
    let totalExpense = 0

    transactions.forEach(function(tx) {
        if (tx.type === 'income') {
            totalIncome += tx.amount
        } else {
            totalExpense += tx.amount
        }
    })

    const totalBalance = totalIncome - totalExpense
    const statsElements = document.querySelectorAll('.stat-val')

    statsElements[0].textContent = '₹' + totalBalance
    statsElements[1].textContent = '₹' + totalIncome
    statsElements[2].textContent = '₹' + totalExpense

    renderTransactions()
}

sortPills.forEach(function(pill) {
    pill.addEventListener('click', function() {
        sortPills.forEach(function(p) { p.classList.remove('active') })
        pill.classList.add('active')
        activeSort = pill.getAttribute('data-sort')
        renderTransactions()
    })
})

let exchangeRates = {}

async function fetchRates() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/INR')
        const data = await response.json()
        exchangeRates = data.rates
        updateConverter()
    } catch (error) {
        console.log("there is an error fetching data", error)
    alert('Failed to fetch exchange rates. Please check your internet connection.')
    }
}

function updateConverter() {
    const fromCurrency = document.getElementById('fromCurrency').value
    const toCurrency = document.getElementById('toCurrency').value

    const fromSymbol = currencySymbols[fromCurrency] || '';
    const toSymbol = currencySymbols[toCurrency] || '';

    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return;

    let balanceINR = 0;
    transactions.forEach(function(tx) {
        if (tx.type === 'income') {
            balanceINR += tx.amount;
        } else {
            balanceINR -= tx.amount;
        }
    });

    const balanceInFromUnit = balanceINR * exchangeRates[fromCurrency];
    
    const conversionRate = exchangeRates[toCurrency] / exchangeRates[fromCurrency];
    const finalConvertedValue = balanceInFromUnit * conversionRate;

    document.querySelector('.converter-from').textContent = `${fromSymbol}${Math.round(balanceInFromUnit).toLocaleString()} =`;
    document.querySelector('.converter-to').textContent = `${toSymbol}${finalConvertedValue.toFixed(2)}`;
}

document.getElementById('fromCurrency').addEventListener('change', updateConverter)
document.getElementById('toCurrency').addEventListener('change', updateConverter)

fetchRates()

function renderNews() {
    const newsPanel = document.querySelector('.ti-news')?.closest('.panel');
    
    if (!newsPanel) return; 
    newsPanel.innerHTML = `<div class="panel-title"><i class="ti ti-news"></i> Financial news</div>`;

    
    newsData.forEach(function(item) {
        const newsItemHTML = `
            <div class="news-item">
                <span class="news-tag">${item.tag}</span>
                <div class="news-title">${item.title}</div>
                <div class="news-src">${item.src}</div>
            </div>
        `;
        newsPanel.insertAdjacentHTML('beforeend', newsItemHTML);
    });
}
renderNews()


refreshBtn.addEventListener('click', function() {
    updateDynamicContent()
    fetchRates()
})

function updateDynamicContent() {
  const randomTip = financeTips[Math.floor(Math.random() * financeTips.length)];
  const tipText = document.querySelector('.tip-text');
  if (tipText) tipText.textContent = randomTip;
}
updateDynamicContent()

updateDashboard()