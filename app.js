// ═══════════════════════════════════════════════════════════════════════════════
// ISE VOMS — Frontend API Layer + App Controller
// Isha Steels Enterprises — Vehicle Operations Management System
// ═══════════════════════════════════════════════════════════════════════════════

var API = 'https://script.google.com/macros/s/AKfycbzH3MhOwSmrTCOdtcWBjYvArIM08S2AJmzA3NVec7EF_izfy3hzSobV6T8du1uFkev6/exec'; // ← Paste GAS URL after deploy

// ── State ─────────────────────────────────────────────────────────────────────
var _U = null, _TOKEN = null, _D = {}, _cbIdx = 0;

// ── JSONP API call (CORS-free) ────────────────────────────────────────────────
function _api(action, data, ok, err) {
  var cbName = '_gcb' + (++_cbIdx);
  var timeout;
  window[cbName] = function(r) {
    clearTimeout(timeout);
    try { delete window[cbName]; } catch(e) {}
    var s = document.getElementById('_s_' + cbName);
    if (s) s.remove();
    if (r && r.success === false && r.error === 'NOT_AUTHENTICATED') { _signOut(); return; }
    if (ok) ok(r);
  };
  timeout = setTimeout(function() {
    try { delete window[cbName]; } catch(e) {}
    if (err) err({ message: 'Request timed out' });
    else showToast('⚠️ Request timed out', 'error');
  }, 25000);
  var url = API + '?callback=' + cbName + '&payload=' +
    encodeURIComponent(JSON.stringify({ action: action, data: data || {}, token: _TOKEN || '' }));
  var sc = document.createElement('script');
  sc.id = '_s_' + cbName; sc.src = url;
  sc.onerror = function() {
    clearTimeout(timeout);
    if (err) err({ message: 'Network error' });
    else showToast('⚠️ Network error', 'error');
  };
  document.head.appendChild(sc);
}

// ── Session ───────────────────────────────────────────────────────────────────
function _saveSession(token, user) {
  _TOKEN = token; _U = user;
  localStorage.setItem('ise_token', token);
  localStorage.setItem('ise_user', JSON.stringify(user));
}

function _loadSession() {
  _TOKEN = localStorage.getItem('ise_token') || null;
  var u  = localStorage.getItem('ise_user');
  _U     = u ? JSON.parse(u) : null;
  return !!(_TOKEN && _U);
}

function _signOut() {
  localStorage.removeItem('ise_token');
  localStorage.removeItem('ise_user');
  _TOKEN = null; _U = null; _D = {};
  showPage('loginPage');
  showToast('Logged out.', 'info');
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  if ('serviceWorker' in navigator)
    navigator.serviceWorker.register('sw.js', { scope: './' });

  if (_loadSession()) {
    showPage('appShell');
    showNav();
    loadAllData();
  } else {
    showPage('loginPage');
  }

  // Login form
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('loginEmail').addEventListener('keydown', function(e){ if(e.key==='Enter') doLogin(); });
  document.getElementById('loginPass').addEventListener('keydown',  function(e){ if(e.key==='Enter') doLogin(); });
});

// ── Login ─────────────────────────────────────────────────────────────────────
function doLogin() {
  var email = document.getElementById('loginEmail').value.trim();
  var pass  = document.getElementById('loginPass').value.trim();
  if (!email || !pass) { showToast('Enter email and password.', 'error'); return; }
  setBtnLoading('loginBtn', true);
  _api('login', { email: email, password: pass }, function(r) {
    setBtnLoading('loginBtn', false);
    if (!r.success) { showToast(r.error || 'Login failed.', 'error'); return; }
    _saveSession(r.token, r.user);
    showPage('appShell');
    showNav();
    loadAllData();
    showToast('Welcome, ' + r.user.name + '!', 'success');
  }, function(e) {
    setBtnLoading('loginBtn', false);
    showToast('Connection error. Check internet.', 'error');
  });
}

// ── Load all data on login ─────────────────────────────────────────────────────
function loadAllData() {
  showLoader(true);
  _api('getAllData', {}, function(r) {
    showLoader(false);
    if (!r.success) { showToast('Data load failed.', 'error'); return; }
    _D = r;
    renderNav();
    navigateTo('dashboard');
  }, function() {
    showLoader(false);
    showToast('Failed to load data.', 'error');
  });
}

// ── Refresh ───────────────────────────────────────────────────────────────────
function refreshData() {
  showLoader(true);
  _api('getAllData', {}, function(r) {
    showLoader(false);
    if (!r.success) return;
    _D = r;
    var active = document.querySelector('.nav-item.active');
    if (active) navigateTo(active.dataset.page);
  }, function() { showLoader(false); });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════════════════════
var NAV_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',    icon: '📊', roles: ['admin','manager','driver'] },
  { id: 'vehicles',    label: 'Vehicles',      icon: '🚗', roles: ['admin','manager'] },
  { id: 'drivers',     label: 'Drivers',       icon: '👷', roles: ['admin','manager'] },
  { id: 'attendance',  label: 'Attendance',    icon: '✅', roles: ['admin','manager','driver'] },
  { id: 'inspection',  label: 'Inspection',    icon: '🔍', roles: ['admin','manager','driver'] },
  { id: 'cleaning',    label: 'Cleaning',      icon: '🧹', roles: ['admin','manager','driver'] },
  { id: 'fuel',        label: 'Fuel',          icon: '⛽', roles: ['admin','manager','driver'] },
  { id: 'trips',       label: 'Trips',         icon: '🛣️', roles: ['admin','manager','driver'] },
  { id: 'services',    label: 'Services',      icon: '🔧', roles: ['admin','manager'] },
  { id: 'maintenance', label: 'Maintenance',   icon: '🗓️', roles: ['admin','manager'] },
  { id: 'dispatch',    label: 'Dispatch',      icon: '🚛', roles: ['admin','manager'] },
  { id: 'expenses',    label: 'Expenses',      icon: '💰', roles: ['admin','manager'] },
  { id: 'fastag',      label: 'Fastag',        icon: '🏧', roles: ['admin','manager'] },
  { id: 'reminders',   label: 'Reminders',     icon: '🔔', roles: ['admin','manager'] },
  { id: 'reports',     label: 'Reports',       icon: '📄', roles: ['admin','manager'] },
  { id: 'users',       label: 'Users',         icon: '👤', roles: ['admin'] },
];

function showNav() {
  document.getElementById('sideNav').style.display = 'flex';
  document.getElementById('topBar').style.display  = 'flex';
}

function renderNav() {
  var role = _U ? _U.role : '';
  var html = NAV_ITEMS.filter(function(n){ return n.roles.indexOf(role) > -1; })
    .map(function(n) {
      return '<div class="nav-item" data-page="' + n.id + '" onclick="navigateTo(\'' + n.id + '\')">' +
        '<span class="nav-icon">' + n.icon + '</span><span class="nav-label">' + n.label + '</span></div>';
    }).join('');
  document.getElementById('navItems').innerHTML = html;
  document.getElementById('userInfo').innerHTML =
    '<div class="user-avatar">' + (_U.name||'U').charAt(0).toUpperCase() + '</div>' +
    '<div><div class="user-name">' + (_U.name||'') + '</div>' +
    '<div class="user-role">' + (_U.role||'') + '</div></div>';
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(function(el){ el.classList.remove('active'); });
  var navEl = document.querySelector('.nav-item[data-page="' + page + '"]');
  if (navEl) navEl.classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  var content = document.getElementById('mainContent');

  var renderers = {
    dashboard:   renderDashboard,
    vehicles:    renderVehicles,
    drivers:     renderDrivers,
    attendance:  renderAttendance,
    inspection:  renderInspection,
    cleaning:    renderCleaning,
    fuel:        renderFuel,
    trips:       renderTrips,
    services:    renderServices,
    maintenance: renderMaintenance,
    dispatch:    renderDispatch,
    expenses:    renderExpenses,
    fastag:      renderFastag,
    reminders:   renderReminders,
    reports:     renderReports,
    users:       renderUsers,
  };

  content.innerHTML = '<div class="page-loader">Loading...</div>';
  setTimeout(function() {
    if (renderers[page]) content.innerHTML = renderers[page]();
    else content.innerHTML = '<div class="empty-state">Module coming soon.</div>';
  }, 60);

  // Close sidebar on mobile
  if (window.innerWidth < 768) closeSidebar();
}

var PAGE_TITLES = {
  dashboard:'Dashboard', vehicles:'Fleet — Vehicles', drivers:'Fleet — Drivers',
  attendance:'Driver Attendance', inspection:'Vehicle Inspection', cleaning:'Vehicle Cleaning',
  fuel:'Fuel Entries', trips:'Vehicle Trips', services:'Vehicle Services',
  maintenance:'Maintenance Schedule', dispatch:'Dispatch Trips', expenses:'Vehicle Expenses',
  fastag:'Fastag Transactions', reminders:'Reminders & Alerts', reports:'Reports',
  users:'User Management'
};

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
function renderDashboard() {
  var v = _D.vehicles || [], dr = _D.drivers || [];
  var today = new Date().toISOString().split('T')[0];
  var att = _D.attendance || _D.myAttendance || [];
  var fuel = _D.fuelEntries || _D.myFuel || [];
  var svc  = _D.services || [];
  var exp  = _D.expenses || [];
  var rem  = _D.reminders || [];
  var maint= _D.maintenance || [];

  var monthStr = today.substring(0,7);
  var activeV  = v.filter(function(x){ return x.Status==='Active'; }).length;
  var underSvc = v.filter(function(x){ return x.Status==='Under Service'; }).length;
  var presentT = att.filter(function(a){ return a.Date===today && a.Status==='Present'; }).length;
  var absentT  = att.filter(function(a){ return a.Date===today && a.Status==='Absent'; }).length;
  var fuelCost = fuel.filter(function(f){ return String(f.Date||'').startsWith(monthStr); })
                     .reduce(function(s,f){ return s+(parseFloat(f.Amount)||0); }, 0);
  var svcCost  = svc.filter(function(s){ return String(s.ServiceDate||'').startsWith(monthStr); })
                    .reduce(function(s,x){ return s+(parseFloat(x.Amount)||0); }, 0);
  var now = new Date();
  var in30 = new Date(now.getTime()+30*86400000);
  var in15 = new Date(now.getTime()+15*86400000);
  var insDue = v.filter(function(x){ var d=new Date(x.InsuranceExpiry); return d>=now&&d<=in30; }).length;
  var pucDue = v.filter(function(x){ var d=new Date(x.PUCExpiry); return d>=now&&d<=in15; }).length;
  var lowFtg = v.filter(function(x){ return (parseFloat(x.FastagBalance)||0)<500; }).length;
  var overdue= maint.filter(function(m){ return m.Status==='Overdue'; }).length;
  var health = Math.max(0,Math.min(100, 100-(insDue*5)-(pucDue*5)-(overdue*3)-(lowFtg*2)-(underSvc*2)));

  var scoreColor = health>=90?'#70AD47':health>=70?'#FFC000':'#FF0000';
  var activeRem = rem.filter(function(r){ return r.Status==='Pending'; });

  return '<div class="dashboard-grid">' +
    kpiCard('🚗','Total Vehicles', v.length, '') +
    kpiCard('✅','Active',         activeV,   'text-green') +
    kpiCard('🔧','Under Service',  underSvc,  underSvc>0?'text-orange':'') +
    kpiCard('👷','Present Today',  presentT,  'text-green') +
    kpiCard('❌','Absent Today',   absentT,   absentT>0?'text-orange':'') +
    kpiCard('⛽','Fuel This Month','₹'+fmt(fuelCost),'') +
    kpiCard('🔩','Service Cost',   '₹'+fmt(svcCost),'') +
    kpiCard('⚠️','Insurance Due',  insDue,    insDue>0?'text-red':'text-green') +
    kpiCard('📋','PUC Due',        pucDue,    pucDue>0?'text-red':'text-green') +
    kpiCard('🏧','Low Fastag',     lowFtg,    lowFtg>0?'text-orange':'text-green') +
    '</div>' +
    '<div class="health-card" style="border-left:5px solid '+scoreColor+'">' +
    '<div class="health-label">🏆 Fleet Health Score</div>' +
    '<div class="health-score" style="color:'+scoreColor+'">'+health+'<span style="font-size:18px">/100</span></div>' +
    '<div class="health-sub">' + (health>=90?'Excellent':health>=70?'Good — Monitor Alerts':'Needs Immediate Attention') + '</div>' +
    '</div>' +
    (activeRem.length ? '<div class="section-title">🔔 Active Reminders</div>' +
    '<div class="list-cards">' + activeRem.slice(0,5).map(function(r){
      var cls = r.Priority==='High'?'badge-red':r.Priority==='Medium'?'badge-orange':'badge-blue';
      return '<div class="list-card"><div class="lc-title">'+(r.VehicleID||'')+'</div>' +
        '<div class="lc-sub">'+r.ReminderType+' — '+r.ReminderDate+'</div>' +
        '<span class="badge '+cls+'">'+r.Priority+'</span></div>';
    }).join('') + '</div>' : '');
}

function kpiCard(icon, label, value, valCls, cardCls) {
  return '<div class="kpi-card '+(cardCls||'kpi-navy')+'"><div class="kpi-icon">'+icon+'</div>' +
    '<div class="kpi-label">'+label+'</div>' +
    '<div class="kpi-value '+(valCls||'')+'">'+value+'</div></div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLES
// ═══════════════════════════════════════════════════════════════════════════════
function renderVehicles() {
  var v = _D.vehicles || [];
  return '<div class="toolbar">' +
    '<input id="vSearch" class="search-input" placeholder="🔍 Search vehicle..." oninput="filterTable(\'vTbl\',this.value)">' +
    '<button class="btn-primary" onclick="showAddVehicleForm()">+ Add Vehicle</button></div>' +
    '<div class="table-wrap"><table class="data-table" id="vTbl">' +
    '<thead><tr><th>ID</th><th>Number</th><th>Brand/Model</th><th>Type</th><th>Status</th>' +
    '<th>Insurance</th><th>PUC</th><th>Fastag ₹</th><th>KM</th><th>Driver</th></tr></thead><tbody>' +
    v.map(function(x){
      var insDate = x.InsuranceExpiry, insCls = dateClass(insDate, 30);
      var pucDate = x.PUCExpiry,       pucCls = dateClass(pucDate, 15);
      var stCls   = x.Status==='Active'?'badge-green':x.Status==='Under Service'?'badge-orange':'badge-red';
      return '<tr onclick="showVehicleDetail(\''+x.VehicleID+'\')" style="cursor:pointer">' +
        '<td><code>'+x.VehicleID+'</code></td>' +
        '<td><strong>'+x.VehicleNo+'</strong></td>' +
        '<td>'+x.Brand+' '+x.Model+'</td>' +
        '<td>'+x.VehicleType+'</td>' +
        '<td><span class="badge '+stCls+'">'+x.Status+'</span></td>' +
        '<td class="'+insCls+'">'+x.InsuranceExpiry+'</td>' +
        '<td class="'+pucCls+'">'+x.PUCExpiry+'</td>' +
        '<td>₹'+(x.FastagBalance||0)+'</td>' +
        '<td>'+(x.CurrentKM||0)+' km</td>' +
        '<td><code>'+(x.AssignedDriverID||'—')+'</code></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddVehicleForm() {
  showModal('Add Vehicle', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle Number*</label><input id="f_VehicleNo" placeholder="UP32AB1234"></div>
      <div class="form-group"><label>Type*</label><select id="f_VehicleType"><option>Car</option><option>Bike</option></select></div>
      <div class="form-group"><label>Brand*</label><input id="f_Brand" placeholder="Tata"></div>
      <div class="form-group"><label>Model*</label><input id="f_Model" placeholder="Ace"></div>
      <div class="form-group"><label>Registration No</label><input id="f_RegistrationNo"></div>
      <div class="form-group"><label>Ownership</label><select id="f_OwnershipType"><option>Company Owned</option><option>Leased</option><option>Vendor Vehicle</option></select></div>
      <div class="form-group"><label>Fuel Type</label><select id="f_FuelType"><option>Diesel</option><option>Petrol</option><option>CNG</option><option>Electric</option></select></div>
      <div class="form-group"><label>Current KM</label><input id="f_CurrentKM" type="number" placeholder="0"></div>
      <div class="form-group"><label>Insurance Expiry</label><input id="f_InsuranceExpiry" type="date"></div>
      <div class="form-group"><label>PUC Expiry</label><input id="f_PUCExpiry" type="date"></div>
      <div class="form-group"><label>Fastag No</label><input id="f_FastagNo"></div>
      <div class="form-group"><label>Fastag Balance ₹</label><input id="f_FastagBalance" type="number" placeholder="0"></div>
      <div class="form-group"><label>Assigned Driver ID</label><input id="f_AssignedDriverID" placeholder="DRV0001"></div>
      <div class="form-group"><label>Engine No</label><input id="f_EngineNo"></div>
      <div class="form-group"><label>Chassis No</label><input id="f_ChassisNo"></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleNo','VehicleType','Brand','Model','RegistrationNo','OwnershipType',
        'FuelType','CurrentKM','InsuranceExpiry','PUCExpiry','FastagNo','FastagBalance','AssignedDriverID','EngineNo','ChassisNo']);
      if (!d.VehicleNo||!d.Brand||!d.Model) { showToast('Required fields missing.','error'); return; }
      setModalLoading(true);
      _api('addVehicle', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Vehicle '+r.id+' added!','success');
        closeModal(); refreshData();
      });
    });
}

function showVehicleDetail(id) {
  var v = (_D.vehicles||[]).find(function(x){ return x.VehicleID===id; });
  if (!v) return;
  var stCls = v.Status==='Active'?'badge-green':v.Status==='Under Service'?'badge-orange':'badge-red';
  showModal('🚗 ' + v.VehicleNo,
    '<div class="detail-grid">' +
    detailRow('ID', v.VehicleID) + detailRow('Type', v.VehicleType) +
    detailRow('Brand', v.Brand+' '+v.Model) + detailRow('Reg No', v.RegistrationNo) +
    detailRow('Status', '<span class="badge '+stCls+'">'+v.Status+'</span>') +
    detailRow('Ownership', v.OwnershipType) + detailRow('Fuel', v.FuelType) +
    detailRow('Current KM', v.CurrentKM+' km') + detailRow('Insurance', v.InsuranceExpiry) +
    detailRow('PUC', v.PUCExpiry) + detailRow('Fastag No', v.FastagNo) +
    detailRow('Fastag Bal', '₹'+v.FastagBalance) + detailRow('Driver', v.AssignedDriverID) +
    detailRow('Engine No', v.EngineNo) + detailRow('Chassis No', v.ChassisNo) +
    '</div>', null, 'Close');
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRIVERS
// ═══════════════════════════════════════════════════════════════════════════════
function renderDrivers() {
  var dr = _D.drivers || [];
  return '<div class="toolbar">' +
    '<input class="search-input" placeholder="🔍 Search driver..." oninput="filterTable(\'drTbl\',this.value)">' +
    '<button class="btn-primary" onclick="showAddDriverForm()">+ Add Driver</button></div>' +
    '<div class="table-wrap"><table class="data-table" id="drTbl">' +
    '<thead><tr><th>ID</th><th>Name</th><th>Mobile</th><th>License</th><th>Expiry</th><th>Blood</th><th>Status</th></tr></thead><tbody>' +
    dr.map(function(d){
      var licCls = dateClass(d.LicenseExpiry, 30);
      var stCls  = d.Status==='Active'?'badge-green':'badge-red';
      return '<tr><td><code>'+d.DriverID+'</code></td>' +
        '<td><strong>'+d.Name+'</strong></td>' +
        '<td>'+d.Mobile+'</td>' +
        '<td>'+d.LicenseNo+'</td>' +
        '<td class="'+licCls+'">'+d.LicenseExpiry+'</td>' +
        '<td><span class="badge badge-blue">'+(d.BloodGroup||'—')+'</span></td>' +
        '<td><span class="badge '+stCls+'">'+d.Status+'</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddDriverForm() {
  showModal('Add Driver', `
    <div class="form-grid">
      <div class="form-group"><label>Full Name*</label><input id="f_Name" placeholder="Ramesh Kumar"></div>
      <div class="form-group"><label>Mobile*</label><input id="f_Mobile" type="tel" placeholder="98XXXXXXXX"></div>
      <div class="form-group"><label>License No*</label><input id="f_LicenseNo" placeholder="UP32 20XXXXXXXXXX"></div>
      <div class="form-group"><label>License Expiry*</label><input id="f_LicenseExpiry" type="date"></div>
      <div class="form-group"><label>Blood Group</label><select id="f_BloodGroup"><option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select></div>
      <div class="form-group"><label>Aadhaar No</label><input id="f_AadhaarNo" placeholder="XXXX XXXX XXXX"></div>
      <div class="form-group"><label>Joining Date</label><input id="f_JoiningDate" type="date"></div>
      <div class="form-group"><label>Salary ₹</label><input id="f_Salary" type="number"></div>
      <div class="form-group"><label>Emergency Contact</label><input id="f_EmergencyContact" type="tel"></div>
      <div class="form-group" style="grid-column:1/-1"><label>Address</label><textarea id="f_Address" rows="2"></textarea></div>
    </div>`,
    function() {
      var d = getFormData(['Name','Mobile','LicenseNo','LicenseExpiry','BloodGroup','AadhaarNo','JoiningDate','Salary','EmergencyContact','Address']);
      if (!d.Name||!d.Mobile||!d.LicenseNo) { showToast('Required fields missing.','error'); return; }
      setModalLoading(true);
      _api('addDriver', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Driver '+r.id+' added!','success');
        closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE
// ═══════════════════════════════════════════════════════════════════════════════
function renderAttendance() {
  var att  = _D.attendance || _D.myAttendance || [];
  var today = new Date().toISOString().split('T')[0];
  var todayAtt = att.filter(function(a){ return a.Date===today; });
  return '<div class="toolbar">' +
    '<span class="date-badge">📅 ' + today + '</span>' +
    '<button class="btn-primary" onclick="showMarkAttendanceForm()">✅ Mark Attendance</button></div>' +
    '<div class="section-title">Today\'s Attendance (' + todayAtt.length + ' records)</div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>Driver ID</th><th>Vehicle</th><th>In Time</th><th>Status</th><th>Location</th></tr></thead><tbody>' +
    todayAtt.map(function(a) {
      var cls = a.Status==='Present'?'badge-green':a.Status==='Absent'?'badge-red':'badge-orange';
      return '<tr><td><code>'+a.DriverID+'</code></td><td><code>'+(a.VehicleID||'—')+'</code></td>' +
        '<td>'+a.InTime+'</td><td><span class="badge '+cls+'">'+a.Status+'</span></td>' +
        '<td>'+( a.Location||'—')+'</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showMarkAttendanceForm() {
  var drOpts = (_D.drivers||[]).map(function(d){
    return '<option value="'+d.DriverID+'">'+d.DriverID+' — '+d.Name+'</option>';
  }).join('');
  var vehOpts = (_D.vehicles||[]).filter(function(v){ return v.Status==='Active'; }).map(function(v){
    return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>';
  }).join('');
  showModal('Mark Attendance', `
    <div class="form-grid">
      <div class="form-group"><label>Driver*</label><select id="f_DriverID"><option value="">Select Driver</option>${drOpts}</select></div>
      <div class="form-group"><label>Vehicle</label><select id="f_VehicleID"><option value="">Select Vehicle</option>${vehOpts}</select></div>
      <div class="form-group"><label>Date*</label><input id="f_Date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Status*</label><select id="f_Status"><option>Present</option><option>Absent</option><option>Late</option><option>Half Day</option></select></div>
      <div class="form-group"><label>In Time</label><input id="f_InTime" type="time" value="${new Date().toTimeString().slice(0,5)}"></div>
      <div class="form-group"><label>Location</label><input id="f_Location" placeholder="Noida Depot"></div>
    </div>`,
    function() {
      var d = getFormData(['DriverID','VehicleID','Date','Status','InTime','Location']);
      if (!d.DriverID) { showToast('Select a driver.','error'); return; }
      setModalLoading(true);
      _api('markAttendance', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Attendance marked!','success');
        closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INSPECTION
// ═══════════════════════════════════════════════════════════════════════════════
function renderInspection() {
  return '<div class="toolbar">' +
    '<span class="toolbar-title">Daily Vehicle Inspection</span>' +
    '<button class="btn-primary" onclick="showInspectionForm()">+ New Inspection</button></div>' +
    '<div class="empty-state">🔍 Tap <strong>+ New Inspection</strong> to start today\'s inspection checklist.</div>';
}

function showInspectionForm() {
  var vehOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>'; }).join('');
  var drOpts  = (_D.drivers ||[]).map(function(d){ return '<option value="'+d.DriverID+'">'+d.DriverID+' — '+d.Name+'</option>'; }).join('');
  var checks  = ['FuelCheck','TyreCheck','MirrorCheck','FastagCheck','RCCheck','InsuranceCheck','PUCCheck'];
  var checkLabels = ['Fuel Level','Tyre Condition','Mirrors OK','Fastag Present','RC Present','Insurance Copy','PUC Copy'];
  var checkHtml = checks.map(function(c,i){
    return '<div class="form-group check-row"><label>'+checkLabels[i]+'</label>' +
      '<select id="f_'+c+'"><option value="Yes">✅ Yes</option><option value="No">❌ No</option></select></div>';
  }).join('');
  showModal('Vehicle Inspection',
    '<div class="form-grid">' +
    '<div class="form-group"><label>Vehicle*</label><select id="f_VehicleID"><option value="">Select</option>'+vehOpts+'</select></div>' +
    '<div class="form-group"><label>Driver*</label><select id="f_DriverID"><option value="">Select</option>'+drOpts+'</select></div>' +
    '<div class="form-group"><label>Date</label><input id="f_Date" type="date" value="'+new Date().toISOString().split('T')[0]+'"></div>' +
    checkHtml +
    '<div class="form-group" style="grid-column:1/-1"><label>Remarks</label><textarea id="f_Remarks" rows="2"></textarea></div>' +
    '</div>',
    function() {
      var d = getFormData(['VehicleID','DriverID','Date','FuelCheck','TyreCheck','MirrorCheck',
        'FastagCheck','RCCheck','InsuranceCheck','PUCCheck','Remarks']);
      if (!d.VehicleID||!d.DriverID) { showToast('Select vehicle and driver.','error'); return; }
      setModalLoading(true);
      _api('addInspection', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Inspection saved: '+r.id,'success');
        closeModal();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// CLEANING
// ═══════════════════════════════════════════════════════════════════════════════
function renderCleaning() {
  return '<div class="toolbar"><span class="toolbar-title">Vehicle Cleaning Log</span>' +
    '<button class="btn-primary" onclick="showCleaningForm()">+ Add Cleaning Log</button></div>' +
    '<div class="empty-state">🧹 Log daily cleaning records for each vehicle.</div>';
}

function showCleaningForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>'; }).join('');
  var dOpts = (_D.drivers ||[]).map(function(d){ return '<option value="'+d.DriverID+'">'+d.DriverID+' — '+d.Name+'</option>'; }).join('');
  var checks = ['ExteriorClean','InteriorClean','MatClean','DashboardClean','SeatClean','MirrorClean','TyrePolish','PerfumeAvailable'];
  var labels = ['Exterior Clean','Interior Clean','Mats Cleaned','Dashboard Clean','Seats Clean','Mirrors Clean','Tyre Polish','Perfume Available'];
  showModal('Cleaning Log',
    '<div class="form-grid">' +
    '<div class="form-group"><label>Vehicle*</label><select id="f_VehicleID"><option>'+vOpts+'</option></select></div>' +
    '<div class="form-group"><label>Driver*</label><select id="f_DriverID"><option>'+dOpts+'</option></select></div>' +
    '<div class="form-group"><label>Date</label><input id="f_Date" type="date" value="'+new Date().toISOString().split('T')[0]+'"></div>' +
    checks.map(function(c,i){ return '<div class="form-group"><label>'+labels[i]+'</label><select id="f_'+c+'"><option value="Yes">✅ Yes</option><option value="No">❌ No</option></select></div>'; }).join('') +
    '</div>',
    function() {
      var d = getFormData(['VehicleID','DriverID','Date'].concat(checks));
      setModalLoading(true);
      _api('addCleaning', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Cleaning log saved!','success'); closeModal();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUEL
// ═══════════════════════════════════════════════════════════════════════════════
function renderFuel() {
  var fuel = _D.fuelEntries || _D.myFuel || [];
  var total = fuel.reduce(function(s,f){ return s+(parseFloat(f.Amount)||0); }, 0);
  var qty   = fuel.reduce(function(s,f){ return s+(parseFloat(f.FuelQty)||0); }, 0);
  return '<div class="toolbar">' +
    '<div class="kpi-mini-row">' +
    '<span class="kpi-mini">Total: ₹'+fmt(total)+'</span>' +
    '<span class="kpi-mini">Qty: '+qty.toFixed(1)+' L</span>' +
    '</div>' +
    '<button class="btn-primary" onclick="showAddFuelForm()">+ Add Fuel</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>Date</th><th>Vehicle</th><th>Driver</th><th>KM</th><th>Qty (L)</th><th>Amount ₹</th><th>₹/L</th><th>Km/L</th><th>Pump</th></tr></thead><tbody>' +
    fuel.slice().reverse().slice(0,40).map(function(f) {
      return '<tr><td>'+f.Date+'</td><td><code>'+f.VehicleID+'</code></td>' +
        '<td><code>'+f.DriverID+'</code></td><td>'+(f.KMReading||0)+'</td>' +
        '<td>'+(f.FuelQty||0)+'</td><td><strong>₹'+(f.Amount||0)+'</strong></td>' +
        '<td>'+(f.CostPerLiter||0)+'</td><td>'+(f.Mileage||0)+'</td>' +
        '<td>'+( f.PumpName||'—')+'</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddFuelForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+' ('+v.CurrentKM+' km)</option>'; }).join('');
  var dOpts = (_D.drivers ||[]).map(function(d){ return '<option value="'+d.DriverID+'">'+d.DriverID+' — '+d.Name+'</option>'; }).join('');
  showModal('Add Fuel Entry', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle*</label><select id="f_VehicleID" onchange="autoFillPrevKM(this.value)">${vOpts}</select></div>
      <div class="form-group"><label>Driver*</label><select id="f_DriverID">${dOpts}</select></div>
      <div class="form-group"><label>Date*</label><input id="f_Date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Previous KM</label><input id="f_PreviousKM" type="number" placeholder="Auto-filled"></div>
      <div class="form-group"><label>Current KM*</label><input id="f_KMReading" type="number" placeholder="Enter odometer reading"></div>
      <div class="form-group"><label>Fuel Qty (L)*</label><input id="f_FuelQty" type="number" step="0.1" placeholder="35.5"></div>
      <div class="form-group"><label>Amount ₹*</label><input id="f_Amount" type="number" placeholder="3500"></div>
      <div class="form-group"><label>Pump Name</label><input id="f_PumpName" placeholder="HP Petrol Pump"></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleID','DriverID','Date','PreviousKM','KMReading','FuelQty','Amount','PumpName']);
      if (!d.VehicleID||!d.KMReading||!d.FuelQty||!d.Amount) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addFuel', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Fuel logged! Mileage: '+r.mileage+' km/l','success');
        closeModal(); refreshData();
      });
    });
}

function autoFillPrevKM(vid) {
  var v = (_D.vehicles||[]).find(function(x){ return x.VehicleID===vid; });
  if (v) { var el = document.getElementById('f_PreviousKM'); if(el) el.value = v.CurrentKM || 0; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRIPS
// ═══════════════════════════════════════════════════════════════════════════════
function renderTrips() {
  var trips = _D.trips || _D.myTrips || [];
  return '<div class="toolbar"><span class="toolbar-title">Vehicle Trips ('+trips.length+')</span>' +
    '<button class="btn-primary" onclick="showAddTripForm()">+ Log Trip</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>Date</th><th>Vehicle</th><th>From</th><th>To</th><th>Material</th><th>Weight(T)</th><th>KM</th></tr></thead><tbody>' +
    trips.slice().reverse().slice(0,30).map(function(t) {
      return '<tr><td>'+t.Date+'</td><td><code>'+t.VehicleID+'</code></td>' +
        '<td>'+t.FromLocation+'</td><td>'+t.ToLocation+'</td>' +
        '<td>'+t.MaterialType+'</td><td>'+t.Weight+'</td>' +
        '<td><strong>'+t.TotalKM+' km</strong></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddTripForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>'; }).join('');
  var dOpts = (_D.drivers ||[]).map(function(d){ return '<option value="'+d.DriverID+'">'+d.DriverID+' — '+d.Name+'</option>'; }).join('');
  showModal('Log Trip', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle*</label><select id="f_VehicleID">${vOpts}</select></div>
      <div class="form-group"><label>Driver*</label><select id="f_DriverID">${dOpts}</select></div>
      <div class="form-group"><label>Date*</label><input id="f_Date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>From Location*</label><input id="f_FromLocation" placeholder="Noida Depot"></div>
      <div class="form-group"><label>To Location*</label><input id="f_ToLocation" placeholder="Delhi Warehouse"></div>
      <div class="form-group"><label>Material Type</label><select id="f_MaterialType"><option value="">Select Material</option><option>MS Channel</option><option>MS Angle</option><option>MS Flat Bar</option><option>MS Round Bar</option><option>ERW Pipe</option><option>ISI Mark Pipe</option><option>TMT Bar</option><option>Square Bar</option><option>MS Beam</option><option>Steel Plate</option><option>Mixed Products</option></select></div>
      <div class="form-group"><label>Weight (Tonnes)</label><input id="f_Weight" type="number" step="0.1"></div>
      <div class="form-group"><label>Start KM</label><input id="f_StartKM" type="number"></div>
      <div class="form-group"><label>End KM</label><input id="f_EndKM" type="number"></div>
      <div class="form-group" style="grid-column:1/-1"><label>Remarks</label><input id="f_Remarks"></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleID','DriverID','Date','FromLocation','ToLocation','MaterialType','Weight','StartKM','EndKM','Remarks']);
      if (!d.VehicleID||!d.FromLocation||!d.ToLocation) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addTrip', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Trip logged: '+r.id,'success'); closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICES
// ═══════════════════════════════════════════════════════════════════════════════
function renderServices() {
  var svc = _D.services || [];
  return '<div class="toolbar"><span class="toolbar-title">Vehicle Services ('+svc.length+')</span>' +
    '<button class="btn-primary" onclick="showAddServiceForm()">+ Add Service</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>ID</th><th>Vehicle</th><th>Type</th><th>Date</th><th>Garage</th><th>Amount ₹</th><th>Status</th></tr></thead><tbody>' +
    svc.slice().reverse().map(function(s) {
      var cls = s.Status==='Completed'?'badge-green':s.Status==='Pending'?'badge-orange':'badge-blue';
      return '<tr><td><code>'+s.ServiceID+'</code></td><td><code>'+s.VehicleID+'</code></td>' +
        '<td>'+(s.ServiceType||'')+'</td><td>'+s.ServiceDate+'</td>' +
        '<td>'+s.GarageName+'</td><td>₹'+(s.Amount||0)+'</td>' +
        '<td><span class="badge '+cls+'">'+s.Status+'</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddServiceForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>'; }).join('');
  showModal('Add Service Record', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle*</label><select id="f_VehicleID">${vOpts}</select></div>
      <div class="form-group"><label>Service Type*</label><select id="f_ServiceType"><option>Regular Service</option><option>Major Service</option><option>Oil Change</option><option>Tyre Work</option><option>Brake Work</option><option>Electrical Work</option><option>Repair</option><option>Other</option></select></div>
      <div class="form-group"><label>Service Date*</label><input id="f_ServiceDate" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Garage Name*</label><input id="f_GarageName" placeholder="AutoFix Garage"></div>
      <div class="form-group"><label>Service KM</label><input id="f_ServiceKM" type="number"></div>
      <div class="form-group"><label>Amount ₹</label><input id="f_Amount" type="number"></div>
      <div class="form-group"><label>Technician Name</label><input id="f_TechnicianName"></div>
      <div class="form-group"><label>Next Service Date</label><input id="f_NextServiceDate" type="date"></div>
      <div class="form-group"><label>Next Service KM</label><input id="f_NextServiceKM" type="number"></div>
      <div class="form-group" style="grid-column:1/-1"><label>Issue / Work Done</label><textarea id="f_Issue" rows="2"></textarea></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleID','ServiceType','ServiceDate','GarageName','ServiceKM','Amount','TechnicianName','NextServiceDate','NextServiceKM','Issue']);
      if (!d.VehicleID||!d.GarageName) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addService', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Service record created: '+r.id,'success'); closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAINTENANCE
// ═══════════════════════════════════════════════════════════════════════════════
function renderMaintenance() {
  var maint = _D.maintenance || [];
  return '<div class="toolbar"><span class="toolbar-title">Maintenance Schedule</span>' +
    '<button class="btn-primary" onclick="showAddMaintenanceForm()">+ Add Schedule</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>ID</th><th>Vehicle</th><th>Type</th><th>Last Done</th><th>Next Due</th><th>Next KM</th><th>Status</th></tr></thead><tbody>' +
    maint.map(function(m) {
      var cls = m.Status==='Overdue'?'badge-red':m.Status==='Pending'?'badge-orange':'badge-green';
      return '<tr><td><code>'+m.ScheduleID+'</code></td><td><code>'+m.VehicleID+'</code></td>' +
        '<td>'+m.MaintenanceType+'</td><td>'+m.LastDoneDate+'</td>' +
        '<td>'+m.NextDueDate+'</td><td>'+(m.NextDueKM||'—')+'</td>' +
        '<td><span class="badge '+cls+'">'+m.Status+'</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddMaintenanceForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>'; }).join('');
  showModal('Add Maintenance Schedule', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle*</label><select id="f_VehicleID">${vOpts}</select></div>
      <div class="form-group"><label>Type*</label><select id="f_MaintenanceType"><option>Service</option><option>Wheel Alignment</option><option>Wheel Balancing</option><option>Tyre Rotation</option><option>Tyre Change</option><option>Battery Check</option></select></div>
      <div class="form-group"><label>Last Done Date</label><input id="f_LastDoneDate" type="date"></div>
      <div class="form-group"><label>Last Done KM</label><input id="f_LastDoneKM" type="number"></div>
      <div class="form-group"><label>Next Due Date*</label><input id="f_NextDueDate" type="date"></div>
      <div class="form-group"><label>Next Due KM</label><input id="f_NextDueKM" type="number"></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleID','MaintenanceType','LastDoneDate','LastDoneKM','NextDueDate','NextDueKM']);
      if (!d.VehicleID||!d.NextDueDate) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addMaintenance', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Schedule added: '+r.id,'success'); closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════
function renderDispatch() {
  var dsp = _D.dispatch || [];
  return '<div class="toolbar"><span class="toolbar-title">Dispatch Trips ('+dsp.length+')</span>' +
    '<button class="btn-primary" onclick="showAddDispatchForm()">+ New Dispatch</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>ID</th><th>Customer</th><th>Material</th><th>Weight(T)</th><th>Invoice</th><th>Loading</th><th>Delivery</th><th>Status</th></tr></thead><tbody>' +
    dsp.slice().reverse().map(function(d) {
      var cls = d.Status==='Delivered'?'badge-green':d.Status==='In Transit'?'badge-blue':d.Status==='Cancelled'?'badge-red':'badge-orange';
      return '<tr><td><code>'+d.DispatchID+'</code></td><td>'+d.CustomerName+'</td>' +
        '<td>'+d.Material+'</td><td>'+d.Weight+'</td><td>'+d.InvoiceNo+'</td>' +
        '<td>'+d.LoadingDate+'</td><td>'+(d.DeliveryDate||'—')+'</td>' +
        '<td><span class="badge '+cls+'">'+d.Status+'</span></td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddDispatchForm() {
  showModal('New Dispatch', `
    <div class="form-grid">
      <div class="form-group"><label>Customer Name*</label><input id="f_CustomerName" placeholder="Bharat Steel Corp"></div>
      <div class="form-group"><label>Material*</label><input id="f_Material" placeholder="TMT Bars"></div>
      <div class="form-group"><label>Weight (Tonnes)*</label><input id="f_Weight" type="number" step="0.1"></div>
      <div class="form-group"><label>Invoice No*</label><input id="f_InvoiceNo" placeholder="ISE/INV/2025/001"></div>
      <div class="form-group"><label>Loading Date*</label><input id="f_LoadingDate" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Expected Delivery</label><input id="f_DeliveryDate" type="date"></div>
      <div class="form-group"><label>Trip ID (if linked)</label><input id="f_TripID" placeholder="TRP0001"></div>
      <div class="form-group"><label>Status</label><select id="f_Status"><option>Pending</option><option>In Transit</option><option>Delivered</option></select></div>
    </div>`,
    function() {
      var d = getFormData(['CustomerName','Material','Weight','InvoiceNo','LoadingDate','DeliveryDate','TripID','Status']);
      if (!d.CustomerName||!d.Material||!d.InvoiceNo) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addDispatch', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Dispatch created: '+r.id,'success'); closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════════
function renderExpenses() {
  var exp = _D.expenses || [];
  var total = exp.reduce(function(s,x){ return s+(parseFloat(x.Amount)||0); }, 0);
  return '<div class="toolbar">' +
    '<span class="kpi-mini">Total: ₹'+fmt(total)+'</span>' +
    '<button class="btn-primary" onclick="showAddExpenseForm()">+ Add Expense</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>Date</th><th>Vehicle</th><th>Category</th><th>Amount ₹</th><th>Mode</th><th>Approved By</th><th>Remarks</th></tr></thead><tbody>' +
    exp.slice().reverse().slice(0,30).map(function(x) {
      return '<tr><td>'+x.Date+'</td><td><code>'+x.VehicleID+'</code></td>' +
        '<td>'+( x.ExpenseCategory||x.ExpenseType||'')+'</td>' +
        '<td><strong>₹'+(x.Amount||0)+'</strong></td>' +
        '<td>'+(x.PaymentMode||'')+'</td>' +
        '<td>'+(x.ApprovedBy||'')+'</td>' +
        '<td>'+(x.Remarks||'')+'</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddExpenseForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+'</option>'; }).join('');
  showModal('Add Expense', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle*</label><select id="f_VehicleID">${vOpts}</select></div>
      <div class="form-group"><label>Category*</label><select id="f_ExpenseCategory"><option>Fuel</option><option>Service</option><option>Insurance</option><option>PUC</option><option>Tyre</option><option>Battery</option><option>Fastag</option><option>Repair</option><option>Miscellaneous</option></select></div>
      <div class="form-group"><label>Date*</label><input id="f_Date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Amount ₹*</label><input id="f_Amount" type="number"></div>
      <div class="form-group"><label>Payment Mode</label><select id="f_PaymentMode"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Credit Card</option><option>Debit Card</option></select></div>
      <div class="form-group" style="grid-column:1/-1"><label>Remarks</label><input id="f_Remarks"></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleID','ExpenseCategory','Date','Amount','PaymentMode','Remarks']);
      d.ExpenseType = d.ExpenseCategory;
      if (!d.VehicleID||!d.Amount) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addExpense', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Expense recorded!','success'); closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FASTAG
// ═══════════════════════════════════════════════════════════════════════════════
function renderFastag() {
  var txns = _D.fastagTxns || [];
  var vLow = (_D.vehicles||[]).filter(function(v){ return (parseFloat(v.FastagBalance)||0)<500; });
  return '<div class="toolbar"><span class="toolbar-title">Fastag Transactions</span>' +
    '<button class="btn-primary" onclick="showFastagRechargeForm()">+ Recharge</button></div>' +
    (vLow.length ? '<div class="alert-banner">🔴 '+vLow.length+' vehicle(s) with low Fastag balance: ' +
      vLow.map(function(v){ return v.VehicleNo+' (₹'+v.FastagBalance+')'; }).join(', ') + '</div>' : '') +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>ID</th><th>Vehicle</th><th>Date</th><th>Opening ₹</th><th>Recharge ₹</th><th>Closing ₹</th><th>Remarks</th></tr></thead><tbody>' +
    txns.slice().reverse().map(function(t) {
      return '<tr><td><code>'+t.TxnID+'</code></td><td><code>'+t.VehicleID+'</code></td>' +
        '<td>'+t.Date+'</td><td>₹'+t.OpeningBalance+'</td>' +
        '<td><strong style="color:#70AD47">+₹'+t.RechargeAmount+'</strong></td>' +
        '<td>₹'+t.ClosingBalance+'</td><td>'+(t.Remarks||'')+'</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showFastagRechargeForm() {
  var vOpts = (_D.vehicles||[]).map(function(v){ return '<option value="'+v.VehicleID+'">'+v.VehicleID+' — '+v.VehicleNo+' (Bal: ₹'+v.FastagBalance+')</option>'; }).join('');
  showModal('Fastag Recharge', `
    <div class="form-grid">
      <div class="form-group"><label>Vehicle*</label><select id="f_VehicleID" onchange="fillFastagBal(this.value)">${vOpts}</select></div>
      <div class="form-group"><label>Opening Balance ₹</label><input id="f_OpeningBalance" type="number" placeholder="Auto-filled"></div>
      <div class="form-group"><label>Recharge Amount ₹*</label><input id="f_RechargeAmount" type="number"></div>
      <div class="form-group"><label>Date*</label><input id="f_Date" type="date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-group"><label>Remarks</label><input id="f_Remarks" placeholder="Monthly recharge"></div>
    </div>`,
    function() {
      var d = getFormData(['VehicleID','OpeningBalance','RechargeAmount','Date','Remarks']);
      if (!d.VehicleID||!d.RechargeAmount) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addFastagTxn', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('Fastag recharged!','success'); closeModal(); refreshData();
      });
    });
}

function fillFastagBal(vid) {
  var v = (_D.vehicles||[]).find(function(x){ return x.VehicleID===vid; });
  if (v) { var el=document.getElementById('f_OpeningBalance'); if(el) el.value=v.FastagBalance||0; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// REMINDERS
// ═══════════════════════════════════════════════════════════════════════════════
function renderReminders() {
  var rem = _D.reminders || [];
  return '<div class="toolbar"><span class="toolbar-title">Active Reminders ('+rem.length+')</span></div>' +
    '<div class="list-cards">' +
    rem.map(function(r) {
      var pc = r.Priority==='High'?'badge-red':r.Priority==='Medium'?'badge-orange':'badge-blue';
      return '<div class="list-card">' +
        '<div class="lc-left"><div class="lc-title">' + r.VehicleID + ' — ' + r.ReminderType + '</div>' +
        '<div class="lc-sub">Due: ' + r.ReminderDate + '</div></div>' +
        '<div class="lc-right"><span class="badge '+pc+'">'+r.Priority+'</span></div></div>';
    }).join('') +
    (rem.length===0?'<div class="empty-state">✅ No active reminders. Fleet is in good shape!</div>':'') +
    '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
function renderReports() {
  return '<div class="reports-grid">' +
    reportCard('⛽','Fuel Report','Monthly fuel cost and mileage summary','showFuelReport()') +
    reportCard('🔧','Service Report','Service history and costs per vehicle','showServiceReport()') +
    reportCard('🚗','Fleet Status','Active, idle and under-service vehicles','showFleetReport()') +
    reportCard('👷','Driver Report','Attendance and performance summary','showDriverReport()') +
    reportCard('💰','Expense Report','Category-wise expense breakdown','showExpenseReport()') +
    reportCard('🚛','Dispatch Report','Material delivery and transit status','showDispatchReport()') +
    '</div>';
}

function reportCard(icon,title,desc,onclick){
  return '<div class="report-card" onclick="'+onclick+'">' +
    '<div class="rc-icon">'+icon+'</div><div class="rc-title">'+title+'</div>' +
    '<div class="rc-desc">'+desc+'</div><div class="rc-arrow">→</div></div>';
}

function showFuelReport() {
  var fuel  = _D.fuelEntries || [];
  var byVeh = {};
  fuel.forEach(function(f) {
    var vid = f.VehicleID;
    if (!byVeh[vid]) byVeh[vid] = { qty:0, amt:0, km:0 };
    byVeh[vid].qty += parseFloat(f.FuelQty)||0;
    byVeh[vid].amt += parseFloat(f.Amount)||0;
    byVeh[vid].km  += parseFloat(f.DistanceTravelled)||0;
  });
  var rows = Object.keys(byVeh).map(function(vid) {
    var b = byVeh[vid];
    var mileage = b.qty>0?(b.km/b.qty).toFixed(1):'—';
    return '<tr><td><code>'+vid+'</code></td><td>'+b.qty.toFixed(1)+'</td><td>₹'+fmt(b.amt)+'</td><td>'+b.km.toFixed(0)+' km</td><td>'+mileage+' km/l</td></tr>';
  }).join('');
  showModal('⛽ Fuel Report — All Time',
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>Vehicle</th><th>Total Qty (L)</th><th>Total Cost ₹</th><th>Total KM</th><th>Avg Mileage</th></tr></thead><tbody>'+rows+'</tbody></table></div>',
    null, 'Close');
}

function showFleetReport() {
  var v = _D.vehicles || [];
  var rows = v.map(function(x){
    var cls = x.Status==='Active'?'badge-green':x.Status==='Under Service'?'badge-orange':'badge-red';
    return '<tr><td><code>'+x.VehicleID+'</code></td><td>'+x.VehicleNo+'</td>' +
      '<td>'+x.Brand+' '+x.Model+'</td><td><span class="badge '+cls+'">'+x.Status+'</span></td>' +
      '<td>'+x.InsuranceExpiry+'</td><td>'+x.PUCExpiry+'</td><td>₹'+x.FastagBalance+'</td></tr>';
  }).join('');
  showModal('🚗 Fleet Status Report',
    '<div class="table-wrap"><table class="data-table"><thead><tr><th>ID</th><th>Number</th><th>Vehicle</th><th>Status</th><th>Insurance</th><th>PUC</th><th>Fastag ₹</th></tr></thead><tbody>'+rows+'</tbody></table></div>',
    null,'Close');
}

function showServiceReport()  { showToast('Opening service report...','info'); }
function showDriverReport()   { showToast('Opening driver report...','info'); }
function showExpenseReport()  { showToast('Opening expense report...','info'); }
function showDispatchReport() { showToast('Opening dispatch report...','info'); }

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (Admin)
// ═══════════════════════════════════════════════════════════════════════════════
function renderUsers() {
  var users = _D.users || [];
  return '<div class="toolbar"><span class="toolbar-title">Users ('+users.length+')</span>' +
    '<button class="btn-primary" onclick="showAddUserForm()">+ Add User</button></div>' +
    '<div class="table-wrap"><table class="data-table">' +
    '<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th></tr></thead><tbody>' +
    users.map(function(u) {
      var stCls = u.Status==='Active'?'badge-green':'badge-red';
      return '<tr><td><code>'+u.UserID+'</code></td><td><strong>'+u.Name+'</strong></td>' +
        '<td>'+u.Email+'</td><td><span class="badge badge-blue">'+u.Role+'</span></td>' +
        '<td><span class="badge '+stCls+'">'+u.Status+'</span></td><td>'+(u.LastLogin||'—')+'</td></tr>';
    }).join('') + '</tbody></table></div>';
}

function showAddUserForm() {
  showModal('Add User', `
    <div class="form-grid">
      <div class="form-group"><label>Full Name*</label><input id="f_Name"></div>
      <div class="form-group"><label>Email*</label><input id="f_Email" type="email" placeholder="name@ishasteels.com"></div>
      <div class="form-group"><label>Mobile</label><input id="f_Mobile" type="tel"></div>
      <div class="form-group"><label>Password*</label><input id="f_Password" placeholder="Min 8 chars"></div>
      <div class="form-group"><label>Role*</label><select id="f_Role"><option>Driver</option><option>Manager</option><option>Admin</option></select></div>
    </div>`,
    function() {
      var d = getFormData(['Name','Email','Mobile','Password','Role']);
      if (!d.Name||!d.Email||!d.Password) { showToast('Fill required fields.','error'); return; }
      setModalLoading(true);
      _api('addUser', d, function(r) {
        setModalLoading(false);
        if (!r.success) { showToast(r.error,'error'); return; }
        showToast('User '+r.id+' created!','success'); closeModal(); refreshData();
      });
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
function showPage(id) {
  ['loginPage','appShell'].forEach(function(p){
    var el = document.getElementById(p);
    if (el) el.style.display = p===id ? 'flex' : 'none';
  });
}

function showLoader(show) {
  var el = document.getElementById('globalLoader');
  if (el) el.style.display = show ? 'flex' : 'none';
}

function showToast(msg, type) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast toast-' + (type||'info') + ' show';
  clearTimeout(t._tmr);
  t._tmr = setTimeout(function(){ t.className = t.className.replace(' show',''); }, 3500);
}

function showModal(title, bodyHtml, onConfirm, confirmLabel) {
  document.getElementById('modalTitle').textContent   = title;
  document.getElementById('modalBody').innerHTML      = bodyHtml;
  document.getElementById('modalOverlay').style.display = 'flex';
  var btn = document.getElementById('modalConfirmBtn');
  if (onConfirm) {
    btn.style.display = 'inline-block';
    btn.textContent   = confirmLabel || 'Save';
    btn.onclick       = onConfirm;
  } else {
    btn.style.display = 'none';
  }
  document.getElementById('modalCancelBtn').textContent = confirmLabel === 'Close' ? 'Close' : 'Cancel';
}

function closeModal() { document.getElementById('modalOverlay').style.display = 'none'; }
function setModalLoading(on) {
  var btn = document.getElementById('modalConfirmBtn');
  if (btn) { btn.disabled = on; btn.textContent = on ? 'Saving...' : (btn._label||'Save'); }
}

function setBtnLoading(id, on) {
  var btn = document.getElementById(id);
  if (!btn) return;
  if (on) { btn._label = btn.textContent; btn.textContent = 'Please wait...'; btn.disabled = true; }
  else     { btn.textContent = btn._label || 'Submit'; btn.disabled = false; }
}

function getFormData(fields) {
  var d = {};
  fields.forEach(function(f) {
    var el = document.getElementById('f_' + f);
    if (el) d[f] = el.value;
  });
  return d;
}

function filterTable(tableId, query) {
  var q = query.toLowerCase();
  var rows = document.querySelectorAll('#' + tableId + ' tbody tr');
  rows.forEach(function(row) {
    row.style.display = row.textContent.toLowerCase().indexOf(q) > -1 ? '' : 'none';
  });
}

function dateClass(dateStr, warnDays) {
  if (!dateStr) return '';
  var d    = new Date(dateStr);
  var now  = new Date();
  var diff = Math.ceil((d - now) / 86400000);
  if (diff < 0)         return 'date-expired';
  if (diff <= warnDays) return 'date-warning';
  return '';
}

function detailRow(label, value) {
  return '<div class="detail-row"><span class="detail-label">'+label+'</span><span class="detail-value">'+(value||'—')+'</span></div>';
}

function fmt(n) { return Number(n||0).toLocaleString('en-IN'); }

function closeSidebar() {
  document.getElementById('sideNav').classList.remove('nav-open');
  document.getElementById('navOverlay').style.display = 'none';
}

function toggleSidebar() {
  var nav = document.getElementById('sideNav');
  var ov  = document.getElementById('navOverlay');
  var isOpen = nav.classList.contains('nav-open');
  nav.classList.toggle('nav-open');
  ov.style.display = isOpen ? 'none' : 'block';
}

// ── ISE VOMS: Override renderDashboard with branded welcome ─────────────────
var _origRenderDashboard = renderDashboard;
function renderDashboard() {
  var today = new Date();
  var greeting = today.getHours() < 12 ? 'Good Morning' : today.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  var dateStr  = today.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
  var welcomeHtml =
    '<div class="dash-welcome">' +
    '<div class="dash-welcome-icon">🏗️</div>' +
    '<div><div class="dash-welcome-title">' + greeting + ', ' + ((_U&&_U.name)||'') + '</div>' +
    '<div class="dash-welcome-sub">' + dateStr + ' &nbsp;·&nbsp; Mandi Gobindgarh, Punjab</div></div>' +
    '<span class="dash-welcome-badge">ISE Fleet</span>' +
    '</div>';
  return welcomeHtml + _origRenderDashboard();
}

// ── ISE Product context in trips (auto-suggest material types) ──────────────
var ISE_MATERIALS = [
  'MS Channel', 'MS Angle', 'MS Flat Bar', 'MS Round Bar',
  'ERW Pipe', 'ISI Mark Pipe', 'TMT Bar', 'Square Bar',
  'MS Beam', 'Steel Plate', 'Mixed Steel Products'
];
