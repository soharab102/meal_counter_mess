class MealManagementSystem {
    constructor() {
        this.members = [];
        this.shoppingItems = [];
        this.dailyMeals = {}; // { "2024-01-01": { memberId: { meals: 2 } } }
        this.mealRecords = [];
        this.currentDate = new Date().toISOString().split('T')[0];
        this.mealRate = 0;
        
        this.loadFromStorage();
        this.setDefaultDate();
        this.renderAll();
    }

    // ==================== মেম্বার ম্যানেজমেন্ট ====================
    addMembers() {
        const count = parseInt(document.getElementById('memberCount').value);
        if (!count || count < 1) {
            alert('দয়া করে মেম্বার সংখ্যা দিন');
            return;
        }
        
        if (this.members.length > 0) {
            if (!confirm('আগের মেম্বাররা মুছে যাবে। আপনি কি নিশ্চিত?')) {
                return;
            }
            this.members = [];
        }
        
        for (let i = 1; i <= count; i++) {
            const name = prompt(`মেম্বার ${i} এর নাম দিন:`, `মেম্বার ${i}`);
            if (name && name.trim()) {
                this.members.push({
                    id: Date.now() + i,
                    name: name.trim(),
                    active: true
                });
            }
        }
        
        this.saveToStorage();
        this.renderMembers();
        this.updateMemberWiseSummary();
        this.showNotification(`${this.members.length} জন মেম্বার যোগ করা হয়েছে!`);
    }

    addSingleMember() {
        const name = prompt('নতুন মেম্বারের নাম দিন:');
        if (name && name.trim()) {
            this.members.push({
                id: Date.now(),
                name: name.trim(),
                active: true
            });
            this.saveToStorage();
            this.renderMembers();
            this.updateMemberWiseSummary();
            this.showNotification(`"${name.trim()}" যোগ করা হয়েছে!`);
        }
    }

    removeMember(id) {
        if (confirm('এই মেম্বারকে রিমুভ করবেন?')) {
            this.members = this.members.filter(m => m.id !== id);
            // ডেইলি মিল থেকেও রিমুভ করুন
            for (let date in this.dailyMeals) {
                delete this.dailyMeals[date][id];
            }
            this.saveToStorage();
            this.renderAll();
            this.showNotification('মেম্বার রিমুভ করা হয়েছে');
        }
    }

    renderMembers() {
        const container = document.getElementById('membersList');
        if (this.members.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">কোন মেম্বার নেই। মেম্বার যোগ করুন।</p>';
            return;
        }
        
        container.innerHTML = this.members.map(m => `
            <div class="member-card">
                <div>
                    <div class="member-name">${this.escapeHtml(m.name)}</div>
                    <div class="member-status">${m.active ? '✅ সক্রিয়' : '❌ নিষ্ক্রিয়'}</div>
                </div>
                <div>
                    <button onclick="system.toggleMember(${m.id})" class="btn-secondary btn-small">
                        ${m.active ? 'নিষ্ক্রিয়' : 'সক্রিয়'}
                    </button>
                    <button onclick="system.removeMember(${m.id})" class="btn-danger btn-small">✕</button>
                </div>
            </div>
        `).join('');
    }

    toggleMember(id) {
        const member = this.members.find(m => m.id === id);
        if (member) {
            member.active = !member.active;
            this.saveToStorage();
            this.renderMembers();
            this.updateMemberWiseSummary();
            this.showNotification(`মেম্বার ${member.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে`);
        }
    }

    // ==================== শপিং লিস্ট ====================
    addShoppingItem() {
        const name = document.getElementById('itemName').value.trim();
        const quantity = parseInt(document.getElementById('itemQuantity').value);
        const price = parseFloat(document.getElementById('itemPrice').value);
        
        if (!name || !quantity || !price) {
            alert('দয়া করে সব ইনপুট পূরণ করুন');
            return;
        }
        
        if (quantity < 1 || price < 0) {
            alert('পরিমাণ ১ এর বেশি এবং দাম ০ বা তার বেশি হতে হবে');
            return;
        }
        
        this.shoppingItems.push({
            id: Date.now(),
            name: name,
            quantity: quantity,
            price: price,
            total: quantity * price
        });
        
        // Clear inputs
        document.getElementById('itemName').value = '';
        document.getElementById('itemQuantity').value = '';
        document.getElementById('itemPrice').value = '';
        
        this.saveToStorage();
        this.renderShopping();
        this.updateShoppingTotal();
        this.showNotification(`"${name}" শপিং লিস্টে যোগ করা হয়েছে`);
    }

    removeShoppingItem(id) {
        if (confirm('এই আইটেম রিমুভ করবেন?')) {
            this.shoppingItems = this.shoppingItems.filter(item => item.id !== id);
            this.saveToStorage();
            this.renderShopping();
            this.updateShoppingTotal();
            this.showNotification('আইটেম রিমুভ করা হয়েছে');
        }
    }

    renderShopping() {
        const container = document.getElementById('shoppingList');
        
        if (this.shoppingItems.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">শপিং লিস্ট খালি। আইটেম যোগ করুন।</p>';
            return;
        }
        
        container.innerHTML = this.shoppingItems.map(item => `
            <div class="shopping-item">
                <div class="item-info">
                    <span class="item-name">${this.escapeHtml(item.name)}</span>
                    <span class="item-detail">পরিমাণ: ${item.quantity}</span>
                    <span class="item-detail">দাম: ৳${item.price.toFixed(2)}</span>
                    <span class="item-price">মোট: ৳${item.total.toFixed(2)}</span>
                </div>
                <button onclick="system.removeShoppingItem(${item.id})" class="btn-danger btn-small">✕</button>
            </div>
        `).join('');
    }

    updateShoppingTotal() {
        const total = this.shoppingItems.reduce((sum, item) => sum + item.total, 0);
        document.getElementById('shoppingTotal').textContent = total.toFixed(2);
        // Auto fill total cost field
        document.getElementById('totalCost').value = total.toFixed(2);
    }

    // ==================== ডেইলি মিল সেটআপ ====================
    setupDailyMeals() {
        const date = document.getElementById('mealDate').value;
        if (!date) {
            alert('দয়া করে একটি তারিখ সিলেক্ট করুন');
            return;
        }
        
        const activeMembers = this.members.filter(m => m.active);
        if (activeMembers.length === 0) {
            alert('কোন সক্রিয় মেম্বার নেই। প্রথমে মেম্বার যোগ করুন।');
            return;
        }
        
        // চেক করুন এই তারিখের ডেটা আগে আছে কিনা
        if (!this.dailyMeals[date]) {
            this.dailyMeals[date] = {};
        }
        
        // প্রতিটি মেম্বারের জন্য ডিফল্ট মিল কাউন্ট সেট করুন
        activeMembers.forEach(member => {
            if (!this.dailyMeals[date][member.id]) {
                this.dailyMeals[date][member.id] = {
                    meals: 0,
                    memberName: member.name
                };
            }
        });
        
        this.saveToStorage();
        this.renderDailyMeals(date);
        this.showNotification(`${date} তারিখের মিল সেটআপ করা হয়েছে`);
    }

    renderDailyMeals(date) {
        const container = document.getElementById('dailyMealsContainer');
        const dailyData = this.dailyMeals[date];
        
        if (!dailyData || Object.keys(dailyData).length === 0) {
            container.innerHTML = '<p style="color: #999;">এই তারিখে কোনো মিল সেটআপ নেই</p>';
            return;
        }
        
        let totalMeals = 0;
        let html = `<div class="daily-meal-card">
            <div class="date-header">📅 ${this.formatDate(date)}</div>`;
        
        // Sort members by name
        const sortedMembers = this.members
            .filter(m => m.active && dailyData[m.id])
            .sort((a, b) => a.name.localeCompare(b.name));
        
        sortedMembers.forEach(member => {
            const data = dailyData[member.id];
            totalMeals += data.meals || 0;
            
            html += `
                <div class="member-meal-row">
                    <span class="member-name">👤 ${this.escapeHtml(member.name)}</span>
                    <div class="meal-inputs">
                        <label>
                            মিল: 
                            <input type="number" 
                                   min="0" 
                                   max="10" 
                                   value="${data.meals || 0}"
                                   onchange="system.updateMealCount('${date}', ${member.id}, this.value)"
                                   class="meal-count-input">
                        </label>
                        <span class="meal-total">${data.meals || 0} টি মিল</span>
                    </div>
                </div>
            `;
        });
        
        html += `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #e9ecef;">
                <strong>মোট মিল: ${totalMeals} টি</strong>
            </div>
        </div>`;
        
        container.innerHTML = html;
    }

    updateMealCount(date, memberId, value) {
        const meals = parseInt(value) || 0;
        if (this.dailyMeals[date] && this.dailyMeals[date][memberId]) {
            this.dailyMeals[date][memberId].meals = meals;
            this.saveToStorage();
            this.updateMealRecords(date);
            this.renderDailyMeals(date);
            this.updateMemberWiseSummary();
            this.showNotification(`মিল আপডেট করা হয়েছে`);
        }
    }

    // ==================== মেম্বারওয়াইস মিল কাউন্ট সারাংশ ====================
    updateMemberWiseSummary() {
        const container = document.getElementById('memberWiseSummary');
        const filterDate = document.getElementById('summaryFilterDate').value;
        
        // Calculate total meals per member
        const memberTotals = {};
        
        // Initialize all members
        this.members.forEach(member => {
            if (member.active) {
                memberTotals[member.id] = {
                    name: member.name,
                    totalMeals: 0,
                    totalCost: 0,
                    dates: {}
                };
            }
        });
        
        // Calculate meals
        for (let date in this.dailyMeals) {
            if (filterDate && date !== filterDate) continue;
            
            const dailyData = this.dailyMeals[date];
            for (let memberId in dailyData) {
                if (memberTotals[memberId]) {
                    const meals = dailyData[memberId].meals || 0;
                    memberTotals[memberId].totalMeals += meals;
                    if (meals > 0) {
                        memberTotals[memberId].dates[date] = meals;
                    }
                }
            }
        }
        
        // Calculate costs (if meal rate is set)
        if (this.mealRate > 0) {
            for (let id in memberTotals) {
                memberTotals[id].totalCost = memberTotals[id].totalMeals * this.mealRate;
            }
        }
        
        // Render summary table
        const activeMembers = Object.values(memberTotals);
        if (activeMembers.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">কোন মেম্বার নেই</p>';
            return;
        }
        
        let html = `
            <div class="summary-table">
                <div class="summary-header">
                    <span>মেম্বারের নাম</span>
                    <span>মোট মিল</span>
                    ${this.mealRate > 0 ? '<span>মোট খরচ</span>' : ''}
                    <span>বিবরণ</span>
                </div>
        `;
        
        // Sort by total meals (highest first)
        activeMembers.sort((a, b) => b.totalMeals - a.totalMeals);
        
        activeMembers.forEach(member => {
            const dateList = Object.keys(member.dates)
                .sort()
                .map(d => `${this.formatDate(d)}: ${member.dates[d]}টি`)
                .join(', ');
            
            html += `
                <div class="summary-row">
                    <span class="member-name">👤 ${this.escapeHtml(member.name)}</span>
                    <span class="meal-count">${member.totalMeals} টি</span>
                    ${this.mealRate > 0 ? `<span class="cost">৳${member.totalCost.toFixed(2)}</span>` : ''}
                    <span style="font-size: 12px; color: #666;">${dateList || 'কোন মিল নেই'}</span>
                </div>
            `;
        });
        
        html += '</div>';
        container.innerHTML = html;
    }

    clearSummaryFilter() {
        document.getElementById('summaryFilterDate').value = '';
        this.updateMemberWiseSummary();
    }

    // ==================== মিল রেকর্ড ====================
    updateMealRecords(date) {
        // এই তারিখের পুরনো রেকর্ড মুছুন
        this.mealRecords = this.mealRecords.filter(r => r.date !== date);
        
        const dailyData = this.dailyMeals[date];
        if (!dailyData) return;
        
        for (let memberId in dailyData) {
            const data = dailyData[memberId];
            if (data.meals > 0) {
                const member = this.members.find(m => m.id == memberId);
                this.mealRecords.push({
                    id: Date.now() + Math.random(),
                    date: date,
                    memberId: parseInt(memberId),
                    memberName: member ? member.name : 'অজানা',
                    meals: data.meals,
                    cost: data.meals * this.mealRate
                });
            }
        }
        
        this.saveToStorage();
        this.renderMealsRecord();
        this.updateMemberWiseSummary();
    }

    renderMealsRecord() {
        const container = document.getElementById('mealsRecord');
        const filterDate = document.getElementById('filterDate').value;
        
        let records = [...this.mealRecords];
        if (filterDate) {
            records = records.filter(r => r.date === filterDate);
        }
        
        if (records.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">কোন মিল রেকর্ড নেই</p>';
            return;
        }
        
        // তারিখ অনুযায়ী সাজান (নতুন থেকে পুরাতন)
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = records.map(r => `
            <div class="meal-record-item">
                <div class="record-info">
                    <span class="record-date">📅 ${this.formatDate(r.date)}</span>
                    <span class="record-member">👤 ${this.escapeHtml(r.memberName)}</span>
                    <span class="record-meals">🍽️ ${r.meals} টি মিল</span>
                    ${r.cost > 0 ? `<span class="record-cost">💰 ৳${r.cost.toFixed(2)}</span>` : ''}
                </div>
                <div>
                    <button onclick="system.deleteRecord(${r.id})" class="btn-danger btn-small">✕</button>
                </div>
            </div>
        `).join('');
    }

    deleteRecord(id) {
        if (confirm('এই রেকর্ড ডিলিট করবেন?')) {
            this.mealRecords = this.mealRecords.filter(r => r.id !== id);
            this.saveToStorage();
            this.renderMealsRecord();
            this.updateMemberWiseSummary();
            this.showNotification('রেকর্ড ডিলিট করা হয়েছে');
        }
    }

    filterMeals() {
        this.renderMealsRecord();
    }

    showAllMeals() {
        document.getElementById('filterDate').value = '';
        this.renderMealsRecord();
    }

    // ==================== কস্ট ক্যালকুলেশন ====================
    calculateCost() {
        const totalCost = parseFloat(document.getElementById('totalCost').value);
        if (!totalCost || totalCost <= 0) {
            alert('দয়া করে মোট খরচ দিন');
            return;
        }
        
        // মোট মিল কাউন্ট করুন
        let totalMeals = 0;
        const memberMeals = {};
        
        this.mealRecords.forEach(record => {
            totalMeals += record.meals;
            if (!memberMeals[record.memberId]) {
                memberMeals[record.memberId] = {
                    name: record.memberName,
                    meals: 0
                };
            }
            memberMeals[record.memberId].meals += record.meals;
        });
        
        if (totalMeals === 0) {
            alert('কোন মিল রেকর্ড নেই! প্রথমে মিল সেটআপ করুন।');
            return;
        }
        
        // মিল রেট ক্যালকুলেট করুন
        this.mealRate = totalCost / totalMeals;
        
        // প্রতিটি মেম্বারের খরচ ক্যালকুলেট করুন
        const memberCosts = {};
        for (let memberId in memberMeals) {
            const data = memberMeals[memberId];
            memberCosts[memberId] = {
                name: data.name,
                meals: data.meals,
                cost: data.meals * this.mealRate
            };
        }
        
        // রেকর্ড আপডেট করুন
        this.mealRecords = this.mealRecords.map(record => {
            record.cost = record.meals * this.mealRate;
            return record;
        });
        
        this.saveToStorage();
        this.renderCostSummary(totalCost, totalMeals, memberCosts);
        this.renderMealsRecord();
        this.updateMemberWiseSummary();
        this.showNotification(`মিল রেট: ৳${this.mealRate.toFixed(2)} প্রতি মিল`);
    }

    renderCostSummary(totalCost, totalMeals, memberCosts) {
        const container = document.getElementById('costSummary');
        
        let html = `
            <div class="summary-grid">
                <div class="summary-card">
                    <h4>মোট খরচ</h4>
                    <div class="value green">৳${totalCost.toFixed(2)}</div>
                </div>
                <div class="summary-card">
                    <h4>মোট মিল</h4>
                    <div class="value blue">${totalMeals} টি</div>
                </div>
                <div class="summary-card">
                    <h4>প্রতি মিল দাম</h4>
                    <div class="value green">৳${this.mealRate.toFixed(2)}</div>
                </div>
            </div>
            <div class="member-cost-table">
                <h4 style="padding: 15px 20px; background: #f8f9fa; margin: 0;">প্রতিটি মেম্বারের খরচ</h4>
        `;
        
        // Sort by cost (highest first)
        const sortedMembers = Object.values(memberCosts).sort((a, b) => b.cost - a.cost);
        
        sortedMembers.forEach(data => {
            html += `
                <div class="member-cost-row">
                    <span class="member-name">👤 ${this.escapeHtml(data.name)}</span>
                    <span class="member-meals">${data.meals} টি মিল</span>
                    <span class="member-cost">৳${data.cost.toFixed(2)}</span>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }

    // ==================== রিপোর্ট ====================
    generateDailyReport() {
        const date = prompt('কোন তারিখের রিপোর্ট চান? (YYYY-MM-DD ফরম্যাটে)', this.currentDate);
        if (!date) return;
        
        const records = this.mealRecords.filter(r => r.date === date);
        if (records.length === 0) {
            this.showReport('এই তারিখে কোনো রেকর্ড নেই');
            return;
        }
        
        const totalMeals = records.reduce((sum, r) => sum + r.meals, 0);
        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
        
        let report = `📅 দৈনিক রিপোর্ট - ${this.formatDate(date)}\n`;
        report += `═`.repeat(60) + `\n`;
        report += `মোট মিল: ${totalMeals} টি\n`;
        report += `মোট খরচ: ৳${totalCost.toFixed(2)}\n`;
        report += `প্রতি মিল দাম: ৳${this.mealRate.toFixed(2)}\n\n`;
        report += `মেম্বারওয়াইস হিসাব:\n`;
        report += `─`.repeat(60) + `\n`;
        
        records.forEach(r => {
            report += `${r.memberName}: ${r.meals} টি মিল = ৳${r.cost.toFixed(2)}\n`;
        });
        
        this.showReport(report);
    }

    generateMonthlyReport() {
        const month = prompt('কোন মাসের রিপোর্ট চান? (YYYY-MM ফরম্যাটে, যেমন: 2024-01)', 
            this.currentDate.substring(0, 7));
        if (!month) return;
        
        const records = this.mealRecords.filter(r => r.date.startsWith(month));
        if (records.length === 0) {
            this.showReport('এই মাসে কোনো রেকর্ড নেই');
            return;
        }
        
        // মেম্বারওয়াইস টোটাল
        const memberTotals = {};
        let totalMeals = 0;
        let totalCost = 0;
        
        records.forEach(r => {
            if (!memberTotals[r.memberId]) {
                memberTotals[r.memberId] = {
                    name: r.memberName,
                    meals: 0,
                    cost: 0
                };
            }
            memberTotals[r.memberId].meals += r.meals;
            memberTotals[r.memberId].cost += r.cost;
            totalMeals += r.meals;
            totalCost += r.cost;
        });
        
        let report = `📆 মাসিক রিপোর্ট - ${month}\n`;
        report += `═`.repeat(60) + `\n`;
        report += `মোট মিল: ${totalMeals} টি\n`;
        report += `মোট খরচ: ৳${totalCost.toFixed(2)}\n`;
        report += `প্রতি মিল দাম: ৳${this.mealRate.toFixed(2)}\n\n`;
        report += `মেম্বারওয়াইস মাসিক হিসাব:\n`;
        report += `─`.repeat(60) + `\n`;
        
        for (let id in memberTotals) {
            const data = memberTotals[id];
            report += `${data.name}: ${data.meals} টি মিল = ৳${data.cost.toFixed(2)}\n`;
        }
        
        this.showReport(report);
    }

    generateMemberReport() {
        const memberName = prompt('কোন মেম্বারের রিপোর্ট চান? (নাম লিখুন)');
        if (!memberName) return;
        
        const member = this.members.find(m => 
            m.name.toLowerCase().includes(memberName.toLowerCase())
        );
        
        if (!member) {
            this.showReport(`"${memberName}" নামে কোন মেম্বার পাওয়া যায়নি`);
            return;
        }
        
        const records = this.mealRecords.filter(r => r.memberId === member.id);
        if (records.length === 0) {
            this.showReport(`${member.name} এর কোনো রেকর্ড নেই`);
            return;
        }
        
        const totalMeals = records.reduce((sum, r) => sum + r.meals, 0);
        const totalCost = records.reduce((sum, r) => sum + r.cost, 0);
        
        let report = `👤 মেম্বার রিপোর্ট - ${member.name}\n`;
        report += `═`.repeat(60) + `\n`;
        report += `মোট মিল: ${totalMeals} টি\n`;
        report += `মোট খরচ: ৳${totalCost.toFixed(2)}\n`;
        report += `প্রতি মিল দাম: ৳${this.mealRate.toFixed(2)}\n\n`;
        report += `মিলের বিবরণ:\n`;
        report += `─`.repeat(60) + `\n`;
        
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        records.forEach(r => {
            report += `${this.formatDate(r.date)}: ${r.meals} টি মিল = ৳${r.cost.toFixed(2)}\n`;
        });
        
        this.showReport(report);
    }

    showReport(text) {
        const container = document.getElementById('reportContainer');
        container.innerHTML = `<pre>${text}</pre>`;
    }

    // ==================== ডেটা ম্যানেজমেন্ট ====================
    saveToStorage() {
        const data = {
            members: this.members,
            shoppingItems: this.shoppingItems,
            dailyMeals: this.dailyMeals,
            mealRecords: this.mealRecords,
            mealRate: this.mealRate
        };
        localStorage.setItem('mealManagementData', JSON.stringify(data));
    }

    loadFromStorage() {
        const stored = localStorage.getItem('mealManagementData');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                this.members = data.members || [];
                this.shoppingItems = data.shoppingItems || [];
                this.dailyMeals = data.dailyMeals || {};
                this.mealRecords = data.mealRecords || [];
                this.mealRate = data.mealRate || 0;
            } catch (e) {
                console.warn('Error loading data:', e);
            }
        }
    }

    exportData() {
        const data = {
            members: this.members,
            shoppingItems: this.shoppingItems,
            dailyMeals: this.dailyMeals,
            mealRecords: this.mealRecords,
            mealRate: this.mealRate,
            exportedAt: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meal-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showNotification('ডেটা এক্সপোর্ট করা হয়েছে!');
    }

    clearData() {
        if (confirm('⚠️ সব ডেটা মুছে যাবে। আপনি কি নিশ্চিত?')) {
            if (confirm('আবারও নিশ্চিত করুন - এটি ফিরিয়ে আনা যাবে না!')) {
                this.members = [];
                this.shoppingItems = [];
                this.dailyMeals = {};
                this.mealRecords = [];
                this.mealRate = 0;
                localStorage.removeItem('mealManagementData');
                this.renderAll();
                this.showNotification('সব ডেটা মুছে ফেলা হয়েছে');
            }
        }
    }

    // ==================== ইউটিলিটি ফাংশন ====================
    setDefaultDate() {
        document.getElementById('mealDate').value = this.currentDate;
        document.getElementById('filterDate').value = '';
        document.getElementById('summaryFilterDate').value = '';
    }

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('bn-BD', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            max-width: 350px;
            font-weight: 500;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    renderAll() {
        this.renderMembers();
        this.renderShopping();
        this.updateShoppingTotal();
        this.renderDailyMeals(this.currentDate);
        this.renderMealsRecord();
        this.updateMemberWiseSummary();
        // Cost summary দেখানোর জন্য
        if (this.mealRate > 0) {
            this.calculateCost();
        }
    }
}

// সিস্টেম ইনিশিয়ালাইজ
const system = new MealManagementSystem();

// গ্লোবাল ফাংশন
window.addMembers = () => system.addMembers();
window.addSingleMember = () => system.addSingleMember();
window.addShoppingItem = () => system.addShoppingItem();
window.setupDailyMeals = () => system.setupDailyMeals();
window.filterMeals = () => system.filterMeals();
window.showAllMeals = () => system.showAllMeals();
window.calculateCost = () => system.calculateCost();
window.updateMemberWiseSummary = () => system.updateMemberWiseSummary();
window.clearSummaryFilter = () => system.clearSummaryFilter();
window.generateDailyReport = () => system.generateDailyReport();
window.generateMonthlyReport = () => system.generateMonthlyReport();
window.generateMemberReport = () => system.generateMemberReport();
window.exportData = () => system.exportData();
window.clearData = () => system.clearData();
window.system = system;