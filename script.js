let transactions = [];
let dailyLimit = 0;

window.onload = function () {
  const storedTransactions = localStorage.getItem('transactions');
  if (storedTransactions) transactions = JSON.parse(storedTransactions);
  const storedLimit = localStorage.getItem('dailyLimit');
  if (storedLimit) {
    dailyLimit = parseFloat(storedLimit);
    document.getElementById('dailyLimit').value = dailyLimit;
  }
  renderTransactions();
  updateSummary();
  updateCharts();
  checkLimit();
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('service-worker.js')
      .then(res => console.log("SW registered", res))
      .catch(err => console.log("SW registration failed", err));
  });
}

function addTransaction() {
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;

  if (isNaN(amount) || amount <= 0 || note.trim() === "") return alert("Please enter valid data.");

  const transaction = { amount, note, type, category, date: new Date().toLocaleDateString() };
  transactions.push(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));

  renderTransactions();
  updateSummary();
  checkLimit();
  updateCharts();

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
}

function renderTransactions(filtered = transactions) {
  const list = document.getElementById("transactionList");
  list.innerHTML = "";
  filtered.forEach((t) => {
    const li = document.createElement("li");
    li.textContent = `${t.date} - ${t.note} (${t.category}): ₹${t.amount} [${t.type}]`;
    list.appendChild(li);
  });
}

function updateSummary() {
  let income = 0, expense = 0;
  transactions.forEach((t) => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });
  document.getElementById("totalIncome").textContent = income.toFixed(2);
  document.getElementById("totalExpense").textContent = expense.toFixed(2);
  document.getElementById("balance").textContent = (income - expense).toFixed(2);
}

function checkLimit() {
  const limit = parseFloat(document.getElementById("dailyLimit").value);
  if (!isNaN(limit)) {
    dailyLimit = limit;
    localStorage.setItem('dailyLimit', dailyLimit);
    const today = new Date().toLocaleDateString();
    const todayExpense = transactions.filter(t => t.type === "expense" && t.date === today).reduce((sum, t) => sum + t.amount, 0);
    document.getElementById("warning").style.display = todayExpense > dailyLimit ? "block" : "none";
  }
}

function filterTransactions() {
  const keyword = document.getElementById("search").value.toLowerCase();
  const category = document.getElementById("categoryFilter").value;
  const filtered = transactions.filter(t => {
    const matchKeyword = t.note.toLowerCase().includes(keyword);
    const matchCategory = category === "all" || t.category === category;
    return matchKeyword && matchCategory;
  });
  renderTransactions(filtered);
}

let pieChart, barChart;
function updateCharts() {
  const ctxPie = document.getElementById('pieChart').getContext('2d');
  const ctxBar = document.getElementById('barChart').getContext('2d');
  const categories = ["Food", "Travel", "Shopping", "Salary", "Other"];
  const expenseData = categories.map(cat => transactions.filter(t => t.category === cat && t.type === "expense").reduce((sum, t) => sum + t.amount, 0));

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctxPie, {
    type: 'pie',
    data: {
      labels: categories,
      datasets: [{
        label: "Expense Distribution",
        data: expenseData,
        backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4caf50", "#9966ff"]
      }]
    }
  });

  if (barChart) barChart.destroy();
  barChart = new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: "Expenses by Category",
        data: expenseData,
        backgroundColor: "#ff6384"
      }]
    }
  });
}

async function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Smart Budget Buddy Report", 10, 10);
  let y = 20;
  transactions.forEach((t) => {
    doc.text(`${t.date} - ${t.note} (${t.category}): ₹${t.amount} [${t.type}]`, 10, y);
    y += 8;
  });
  doc.save("budget-report.pdf");
}
