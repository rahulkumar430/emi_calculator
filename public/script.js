// ==================== DOM ELEMENTS ====================
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

const principalInput = document.getElementById("principal");
const rateInput = document.getElementById("rate");
const tenureInput = document.getElementById("tenure");
const gstRateInput = document.getElementById("gstRate");
const processingFeeInput = document.getElementById("processingFee");
const processingGstRateInput = document.getElementById("processingGstRate");
const calculateBtn = document.getElementById("calculateBtn");
const resetBtn = document.getElementById("resetBtn");
const resultsSection = document.getElementById("resultsSection");
const tableHead = document.getElementById("emiTableHead");

// ==================== BOOTSTRAP TOOLTIP INIT ====================
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((el) => new bootstrap.Tooltip(el));

// ==================== THEME TOGGLE ====================

function setTheme(theme) {
	htmlElement.setAttribute("data-bs-theme", theme);
	localStorage.setItem("emiTheme", theme);

	themeToggle.textContent = theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

	// 🔥 Sync table header with theme
	if (tableHead) {
		tableHead.classList.toggle("table-dark", theme === "dark");
		tableHead.classList.toggle("table-light", theme === "light");
	}
}

setTheme(localStorage.getItem("emiTheme") || "dark");

themeToggle.addEventListener("click", () => {
	const current = htmlElement.getAttribute("data-bs-theme");
	setTheme(current === "dark" ? "light" : "dark");
});

// ==================== EMI CALCULATION ====================
function calculateEMI() {
	const principal = parseFloat(principalInput.value) || 0;
	const annualRate = parseFloat(rateInput.value) || 0;
	const tenure = parseInt(tenureInput.value) || 0;
	const gstOnInterestRate = parseFloat(gstRateInput.value) || 0;
	const processingFee = parseFloat(processingFeeInput.value) || 0;
	const gstOnProcessingRate = parseFloat(processingGstRateInput.value) || 0;

	if (principal <= 0 || annualRate <= 0 || tenure <= 0) {
		alert("Please enter valid values.");
		return;
	}

	const monthlyRate = annualRate / 12 / 100;

	const emi =
		monthlyRate === 0 ? principal / tenure : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);

	let outstanding = principal;
	const monthlyData = [];

	let totalPrincipal = 0;
	let totalInterest = 0;
	let totalGST = 0;

	const totalProcessingWithGST = processingFee * (1 + gstOnProcessingRate / 100);

	for (let m = 1; m <= tenure; m++) {
		const interest = outstanding * monthlyRate;
		const gstInterest = interest * (gstOnInterestRate / 100);
		const principalPaid = emi - interest - gstInterest;

		const procFee = m === 1 ? processingFee : 0;
		const procGST = m === 1 ? processingFee * (gstOnProcessingRate / 100) : 0;

		const totalPayment = principalPaid + interest + gstInterest + procFee + procGST;

		outstanding -= principalPaid;

		totalPrincipal += principalPaid;
		totalInterest += interest;
		totalGST += gstInterest;

		monthlyData.push({
			month: m,
			remainingBalance: Math.max(0, outstanding),
			principalRepaid: principalPaid,
			interest,
			gstOnInterest: gstInterest,
			processingFee: procFee,
			processingGST: procGST,
			totalPayment,
		});
	}

	const totalGSTPaid = totalGST + (processingFee * gstOnProcessingRate) / 100;

	const totalAmountPaid = totalPrincipal + totalInterest + totalGSTPaid + processingFee;

	const extraCost = totalInterest + totalGSTPaid + processingFee;

	displayResults(monthlyData, {
		totalAmountPaid,
		totalInterest,
		totalGSTPaid,
		totalProcessingWithGST,
		extraCost,
	});
}

// ==================== DISPLAY ====================
function displayResults(monthlyData, totals) {
	document.getElementById("totalAmountPaid").textContent = formatCurrency(totals.totalAmountPaid);
	document.getElementById("totalInterest").textContent = formatCurrency(totals.totalInterest);
	document.getElementById("totalGST").textContent = formatCurrency(totals.totalGSTPaid);
	document.getElementById("totalProcessingWithGst").textContent = formatCurrency(totals.totalProcessingWithGST);
	document.getElementById("totalExtraCost").textContent = formatCurrency(totals.extraCost);

	const tableBody = document.getElementById("tableBody");
	tableBody.innerHTML = "";

	let sumPrincipal = 0;
	let sumInterest = 0;
	let sumGST = 0;
	let sumProcessing = 0;
	let sumTotalPayment = 0;

	monthlyData.forEach((row) => {
		sumPrincipal += row.principalRepaid;
		sumInterest += row.interest;
		sumGST += row.gstOnInterest;
		sumProcessing += row.processingFee + row.processingGST;
		sumTotalPayment += row.totalPayment;

		tableBody.innerHTML += `
            <tr>
                <td>${row.month}</td>
                <td>${formatCurrency(row.remainingBalance)}</td>
                <td class="text-success">${formatCurrency(row.principalRepaid)}</td>
                <td class="text-danger">${formatCurrency(row.interest)}</td>
                <td class="text-warning">${formatCurrency(row.gstOnInterest)}</td>
                <td>${formatCurrency(row.processingFee + row.processingGST)}</td>
                <td>${formatCurrency(row.totalPayment)}</td>
            </tr>
        `;
	});

	/* ================= TOTAL ROW ================= */
	tableBody.innerHTML += `
        <tr class="table-total-row">
            <td><strong>Total</strong></td>
            <td>–</td>
            <td class="text-success"><strong>${formatCurrency(sumPrincipal)}</strong></td>
            <td class="text-danger"><strong>${formatCurrency(sumInterest)}</strong></td>
            <td class="text-warning"><strong>${formatCurrency(sumGST)}</strong></td>
            <td><strong>${formatCurrency(sumProcessing)}</strong></td>
            <td><strong>${formatCurrency(sumTotalPayment)}</strong></td>
        </tr>
    `;

	resultsSection.classList.remove("d-none");
	resultsSection.scrollIntoView({ behavior: "smooth" });
}

// ==================== FORMATTER ====================
function formatCurrency(value) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 2,
	}).format(value);
}

// ==================== EVENTS ====================
calculateBtn.addEventListener("click", calculateEMI);

resetBtn.addEventListener("click", () => {
	principalInput.value = 100000;
	rateInput.value = 16;
	tenureInput.value = 12;
	gstRateInput.value = 18;
	processingFeeInput.value = 299;
	processingGstRateInput.value = 18;
	resultsSection.classList.add("d-none");
});

document.addEventListener("keydown", (e) => {
	if (e.key === "Enter") calculateEMI();
});
