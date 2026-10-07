import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AcknowledgmentForm from "./AcknowledgmentForm";
import "./App.css";

const seedPeople = [
  { id: "P-001", name: "Ashok", department: "Marketing" },
  { id: "P-002", name: "Shivani", department: "Management" },
  { id: "P-003", name: "Darisha", department: "Operations" },
];
const seedAssets = [
  {
    id: "LAP-001",
    category: "Laptop",
    site: "Head Office",
    assignee: "Ashok",
    make: "iMac",
    model: "24 inch",
    serial: "C02FP4TCQ6W1",
    status: "Assigned",
    condition: "Good",
  },
  {
    id: "LAP-002",
    category: "Laptop",
    site: "Head Office",
    assignee: "Shivani",
    make: "Dell",
    model: "Core i7",
    serial: "2BR95S2",
    status: "Assigned",
    condition: "Good",
  },
  {
    id: "PHN-001",
    category: "Phone",
    site: "Head Office",
    assignee: "Unassigned",
    make: "Apple",
    model: "iPhone",
    serial: "Pending",
    status: "In stock",
    condition: "Good",
  },
];
const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || "",
  );

function AuthScreen() {
  const [email, setEmail] = useState("avirash.sewcharran@ibvglobal.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function signIn(event) {
    event.preventDefault();
    if (!email.endsWith("@ibvglobal.com"))
      return setError("Use your IBV company email address.");
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError("Invalid company email or password.");
  }
  return (
    <div className="auth-screen">
      <div className="auth-card">
        <img src="/logo.png" alt="IBV International Vaults" />
        <span className="detail-label">Private company access</span>
        <h1>Asset Register</h1>
        <p>Sign in with your IBV company email and password.</p>
        <form onSubmit={signIn}>
          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="primary full">Sign in</button>
        </form>
        {error && <p className="auth-message">{error}</p>}
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [tab, setTab] = useState("People");
  const [people, setPeople] = useState(seedPeople);
  const [assets, setAssets] = useState(seedAssets);
  const [domains, setDomains] = useState([]);
  const [domainHistory, setDomainHistory] = useState([]);
  const [history, setHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [assetSection, setAssetSection] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [modal, setModal] = useState(null);
  const [detail, setDetail] = useState(null);
  const [ack, setAck] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) =>
      setSession(next),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !session) return;
    Promise.all([
      supabase.from("people").select("*").order("name"),
      supabase
        .from("assets")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("assignment_history")
        .select("*, asset:assets(asset_code,make,model), person:people(name)")
        .order("assigned_at", { ascending: false }),
      supabase
        .from("acknowledgments")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("domains").select("*").order("domain"),
      supabase
        .from("domain_history")
        .select("*, domain:domains(domain)")
        .order("recorded_at", { ascending: false }),
    ]).then(([peopleResult, assetResult, historyResult, documentResult, domainsResult, domainHistoryResult]) => {
      if (peopleResult.data?.length)
        setPeople(
          peopleResult.data.map((person) => ({
            ...person,
            employeeNumber: person.employee_number,
          })),
        );
      if (assetResult.data?.length)
        setAssets(
          assetResult.data.map((asset) => ({
            ...asset,
            id: asset.asset_code,
            supabaseId: asset.id,
            assignee: asset.assignee || "Unassigned",
          })),
        );
      if (historyResult.data)
        setHistory(
          historyResult.data.map((entry) => ({
            ...entry,
            asset_code: entry.asset?.asset_code,
            person_name: entry.person?.name,
          })),
        );
      if (documentResult.data) setDocuments(documentResult.data);
      if (domainsResult.data) setDomains(domainsResult.data);
      if (domainHistoryResult.data)
        setDomainHistory(
          domainHistoryResult.data.map((entry) => ({
            ...entry,
            domain_name: entry.domain?.domain,
          })),
        );
    });
  }, [session]);

  const locations = [
    ...new Set(assets.map((asset) => asset.site).filter(Boolean)),
  ];
  const departments = [
    ...new Set(people.map((person) => person.department).filter(Boolean)),
  ];
  const peopleShown = people
    .filter(
      (person) => department === "All" || person.department === department,
    )
    .filter((person) =>
      `${person.name} ${person.employeeNumber || ""} ${person.department || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const assetsShown = assets
    .filter(
      (asset) => assetSection === "All" || asset.category === assetSection,
    )
    .filter((asset) => statusFilter === "All" || asset.status === statusFilter)
    .filter(
      (asset) => locationFilter === "All" || asset.site === locationFilter,
    )
    .filter((asset) =>
      `${asset.id} ${asset.assignee} ${asset.make} ${asset.model} ${asset.serial || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  const domainsShown = domains.filter((item) =>
    `${item.domain} ${item.provider}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function savePerson(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      name: values.name,
      employee_number: values.employeeNumber || null,
      department: values.department || null,
      position: values.position || null,
      email: values.email || null,
    };
    if (values.recordId) {
      if (supabase) {
        const { data, error } = await supabase
          .from("people")
          .update(payload)
          .eq("id", values.recordId)
          .select()
          .single();
        if (error) return window.alert(error.message);
        if (data)
          setPeople((all) =>
            all.map((person) =>
              person.id === data.id
                ? { ...data, employeeNumber: data.employee_number }
                : person,
            ),
          );
        if (data && values.currentName && values.currentName !== data.name) {
          setAssets((all) =>
            all.map((asset) =>
              asset.assignee === values.currentName
                ? { ...asset, assignee: data.name }
                : asset,
            ),
          );
          await supabase
            .from("assets")
            .update({ assignee: data.name })
            .eq("assignee", values.currentName);
        }
      } else {
        setPeople((all) =>
          all.map((person) =>
            person.id === values.recordId
              ? { ...person, ...values, employeeNumber: values.employeeNumber }
              : person,
          ),
        );
        setAssets((all) =>
          all.map((asset) =>
            asset.assignee === values.currentName
              ? { ...asset, assignee: values.name }
              : asset,
          ),
        );
      }
      setModal(null);
      return;
    }
    if (supabase) {
      const { data } = await supabase
        .from("people")
        .insert(payload)
        .select()
        .single();
      if (data)
        setPeople((all) => [
          { ...data, employeeNumber: data.employee_number },
          ...all,
        ]);
    } else
      setPeople((all) => [{ ...values, id: `P-${all.length + 1}` }, ...all]);
    setModal(null);
  }
  async function saveAsset(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const code = `AST-${String(assets.length + 1).padStart(4, "0")}`;
    const payload = {
      asset_code: code,
      category: values.category,
      site: values.site,
      make: values.make,
      model: values.model,
      serial: values.serial || null,
      imei: values.imei || null,
      purchase_date: values.purchaseDate || null,
      purchase_value: values.purchaseValue ? Number(values.purchaseValue) : null,
      on_contract: values.onContract === "on",
      status: values.currentStatus || "In stock",
      condition: values.condition,
    };
    if (values.recordId) {
      const updatePayload = { ...payload };
      delete updatePayload.asset_code;
      if (supabase) {
        const { data, error } = await supabase
          .from("assets")
          .update(updatePayload)
          .eq("id", values.recordId)
          .select()
          .single();
        if (error) return window.alert(error.message);
        if (data)
          setAssets((all) =>
            all.map((asset) =>
              asset.supabaseId === data.id
                ? { ...data, id: data.asset_code, supabaseId: data.id, assignee: data.assignee || "Unassigned" }
                : asset,
            ),
          );
      } else {
        setAssets((all) =>
          all.map((asset) =>
            asset.id === values.recordId
              ? { ...asset, ...payload, id: asset.id, assignee: values.currentAssignee || asset.assignee }
              : asset,
          ),
        );
      }
      setModal(null);
      return;
    }
    if (supabase) {
      const { data } = await supabase
        .from("assets")
        .insert(payload)
        .select()
        .single();
      if (data)
        setAssets((all) => [
          {
            ...data,
            id: data.asset_code,
            supabaseId: data.id,
            assignee: "Unassigned",
          },
          ...all,
        ]);
    } else
      setAssets((all) => [
        { ...payload, id: code, assignee: "Unassigned" },
        ...all,
      ]);
    setModal(null);
  }
  async function saveDomain(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const payload = {
      domain: values.domain.trim().toLowerCase(),
      provider: values.provider.trim(),
      transfer_date: values.transferDate || null,
      renewal_date: values.renewalDate || null,
    };
    if (supabase) {
      const { data, error } = await supabase
        .from("domains")
        .insert(payload)
        .select()
        .single();
      if (error) {
        window.alert(error.message);
        return;
      }
      if (data) {
        setDomains((all) => [...all, data].sort((a, b) => a.domain.localeCompare(b.domain)));
        const { data: historyEntry } = await supabase
          .from("domain_history")
          .insert({ domain_id: data.id, action: "Added", ...payload })
          .select("*, domain:domains(domain)")
          .single();
        if (historyEntry)
          setDomainHistory((all) => [
            { ...historyEntry, domain_name: historyEntry.domain?.domain },
            ...all,
          ]);
      }
    } else {
      const domain = { ...payload, id: `D-${domains.length + 1}` };
      setDomains((all) => [...all, domain].sort((a, b) => a.domain.localeCompare(b.domain)));
      setDomainHistory((all) => [
        { ...domain, domain_id: domain.id, domain_name: domain.domain, action: "Added", recorded_at: new Date().toISOString() },
        ...all,
      ]);
    }
    setModal(null);
  }
  async function assignAsset(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const person = people.find((item) => item.id === values.personId);
    const asset = assets.find((item) => item.id === values.assetId);
    if (!person || !asset) return;
    const action =
      asset.assignee && asset.assignee !== "Unassigned"
        ? "Transferred"
        : "Assigned";
    const timestamp = new Date().toISOString();
    setAssets((all) =>
      all.map((item) =>
        item.id === asset.id
          ? { ...item, assignee: person.name, status: "Assigned" }
          : item,
      ),
    );
    setHistory((all) => [
      {
        asset_id: asset.supabaseId,
        asset_code: asset.id,
        person_id: person.id,
        person_name: person.name,
        action,
        assigned_at: timestamp,
      },
      ...all,
    ]);
    if (supabase && asset.supabaseId && isUuid(person.id)) {
      await supabase
        .from("assets")
        .update({
          assignee: person.name,
          department: person.department,
          status: "Assigned",
        })
        .eq("id", asset.supabaseId);
      await supabase
        .from("assignment_history")
        .insert({
          asset_id: asset.supabaseId,
          person_id: person.id,
          action,
          assigned_at: timestamp,
        });
    }
    setModal(null);
  }
  async function markJunk(asset) {
    if (!window.confirm(`Mark ${asset.id} as junk?`)) return;
    const timestamp = new Date().toISOString();
    setAssets((all) =>
      all.map((item) =>
        item.id === asset.id
          ? { ...item, status: "Junk", assignee: "Unassigned" }
          : item,
      ),
    );
    setHistory((all) => [
      {
        asset_id: asset.supabaseId,
        asset_code: asset.id,
        person_id: null,
        person_name: "",
        action: "Junked",
        assigned_at: timestamp,
      },
      ...all,
    ]);
    if (supabase && asset.supabaseId) {
      await supabase
        .from("assets")
        .update({ status: "Junk", assignee: null })
        .eq("id", asset.supabaseId);
      await supabase
        .from("assignment_history")
        .insert({
          asset_id: asset.supabaseId,
          person_id: null,
          action: "Junked",
          assigned_at: timestamp,
        });
    }
  }
  async function recordAcknowledgment(person, file, path) {
    const record = {
      id: crypto.randomUUID(),
      person_id: person.id,
      employee_name: person.name,
      issue_date: new Date().toISOString().slice(0, 10),
      issued_by_name: "Avirash Sewcharran",
      signed_document_path: path,
      title: file.name,
      status: "Signed",
      created_at: new Date().toISOString(),
    };
    setDocuments((all) => [record, ...all]);
    if (supabase && isUuid(person.id)) {
      const { data } = await supabase
        .from("acknowledgments")
        .insert({
          person_id: person.id,
          employee_name: person.name,
          employee_number: person.employeeNumber || null,
          position: person.position || null,
          issue_date: record.issue_date,
          issued_by_name: record.issued_by_name,
          signed_document_path: path,
          title: file.name,
          status: "Signed",
        })
        .select()
        .single();
      if (data)
        setDocuments((all) => [
          data,
          ...all.filter((item) => item.id !== record.id),
        ]);
    }
  }
  async function viewPdf(documentRecord) {
    if (!documentRecord.signed_document_path) return;
    const { data, error } = await supabase.storage
      .from("asset-acknowledgments")
      .createSignedUrl(documentRecord.signed_document_path, 300);
    if (!error && data?.signedUrl)
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (authLoading)
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <img src="/logo.png" alt="IBV International Vaults" />
          <p>Checking secure access...</p>
        </div>
      </div>
    );
  if (supabase && !session) return <AuthScreen />;
  const modalType = typeof modal === "string" ? modal : modal?.type;
  const modalRecord = typeof modal === "object" ? modal.record : null;
  return (
    <div className="app-shell">
      <Sidebar tab={tab} setTab={setTab} onLogout={() => supabase?.auth.signOut()} />
      <main className="main">
        <Header tab={tab} />
        <div className="top-tabs">
          <button
            className={tab === "People" ? "selected" : ""}
            onClick={() => setTab("People")}
          >
            People <b>{people.length}</b>
          </button>
          <button
            className={tab === "Assets" ? "selected" : ""}
            onClick={() => setTab("Assets")}
          >
            Assets <b>{assets.length}</b>
          </button>
          <button
            className={tab === "Domains" ? "selected" : ""}
            onClick={() => setTab("Domains")}
          >
            Domains <b>{domains.length}</b>
          </button>
          <button
            className={tab === "History" ? "selected" : ""}
            onClick={() => setTab("History")}
          >
            History <b>{history.length}</b>
          </button>
        </div>
        {tab === "People" && (
          <PeopleRegister
            people={peopleShown}
            allAssets={assets}
            documents={documents}
            departments={departments}
            query={query}
            setQuery={setQuery}
            department={department}
            setDepartment={setDepartment}
            setModal={setModal}
            openAck={(person) =>
              setAck({
                person,
                assets: assets.filter(
                  (asset) => asset.assignee === person.name,
                ),
              })
            }
            openDetail={(person) =>
              setDetail({ type: "person", value: person })
            }
            openEdit={(person) => setModal({ type: "editPerson", record: person })}
          />
        )}
        {tab === "Assets" && (
          <AssetsRegister
            assets={assetsShown}
            allAssets={assets}
            locations={locations}
            query={query}
            setQuery={setQuery}
            section={assetSection}
            setSection={setAssetSection}
            status={statusFilter}
            setStatus={setStatusFilter}
            location={locationFilter}
            setLocation={setLocationFilter}
            setModal={setModal}
            openDetail={(asset) => setDetail({ type: "asset", value: asset })}
            openEdit={(asset) => setModal({ type: "editAsset", record: asset })}
            markJunk={markJunk}
          />
        )}
        {tab === "History" && <HistoryTable history={history} />}
        {tab === "Domains" && (
          <DomainsRegister
            domains={domainsShown}
            allDomains={domains}
            query={query}
            setQuery={setQuery}
            setModal={setModal}
            openDetail={(domain) => setDetail({ type: "domain", value: domain })}
          />
        )}
      </main>
      {modal && (
        <RecordModal
          type={modalType}
          record={modalRecord}
          people={people}
          assets={assets}
          locations={locations}
          close={() => setModal(null)}
          submit={
            modalType === "person" || modalType === "editPerson"
              ? savePerson
              : modalType === "asset" || modalType === "editAsset"
                ? saveAsset
                : modalType === "domain"
                  ? saveDomain
                  : assignAsset
          }
        />
      )}
      {detail && (
        <DetailPanel
          detail={detail}
          assets={assets}
          history={history}
          domainHistory={domainHistory}
          documents={documents}
          close={() => setDetail(null)}
          viewPdf={viewPdf}
        />
      )}
      {ack && (
        <AcknowledgmentForm
          person={ack.person}
          assets={ack.assets}
          onClose={() => setAck(null)}
          onUpload={(file, path) =>
            recordAcknowledgment(ack.person, file, path)
          }
        />
      )}
    </div>
  );
}

function Sidebar({ tab, setTab, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <img src="/logo.png" alt="IBV International Vaults" />
        <div>
          <strong>AVI</strong>
          <span>Asset Register</span>
        </div>
      </div>
      <div className="workspace">
        <span className="avatar">A</span>
        <div>
          <strong>IBV International Vaults</strong>
          <span>South Africa group</span>
        </div>
      </div>
      <nav>
        {["People", "Assets", "Domains", "History"].map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <span className="sync-dot" /> Private company register
        <small>Supabase connected</small>
        <button type="button" className="logout-button" onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}
function Header({ tab }) {
  const descriptions = {
    People: "Manage people, equipment and acknowledgment records.",
    Assets: "Track inventory, assignment, condition and lifecycle status.",
    History: "Complete asset ownership and lifecycle timeline.",
    Domains: "Track providers, transfers and domain renewal dates.",
  };
  return (
    <header className="header">
      <div>
        <p className="kicker">Operations / {tab}</p>
        <h1>{tab}</h1>
        <p className="subhead">{descriptions[tab]}</p>
      </div>
      <button className="profile">A &nbsp; Admin</button>
    </header>
  );
}

function PeopleRegister({
  people,
  allAssets,
  documents,
  departments,
  query,
  setQuery,
  department,
  setDepartment,
  setModal,
  openAck,
  openDetail,
  openEdit,
}) {
  return (
    <section className="register">
      <div className="section-heading">
        <div>
          <h2>People register</h2>
          <p>{people.length} people shown</p>
        </div>
        <button className="primary" onClick={() => setModal("person")}>
          + Add person
        </button>
      </div>
      <div className="toolbar enhanced-toolbar">
        <label className="search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, employee number or department..."
          />
        </label>
        <select
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
        >
          <option>All</option>
          {departments.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Department</th>
              <th>Current assets</th>
              <th>Documents</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => {
              const owned = allAssets.filter(
                (asset) => asset.assignee === person.name,
              );
              const files = documents.filter(
                (document) =>
                  document.person_id === person.id ||
                  document.employee_name === person.name,
              );
              return (
                <tr key={person.id}>
                  <td>
                    <strong>{person.name}</strong>
                    <small>{person.employeeNumber || person.id}</small>
                  </td>
                  <td>{person.department || "—"}</td>
                  <td>{owned.length}</td>
                  <td>
                    <span className="count-pill">{files.length}</span>
                  </td>
                  <td>
                    <button
                      className="row-action primary-row"
                      disabled={!owned.length}
                      onClick={() => openAck(person)}
                    >
                      Create acknowledgment
                    </button>
                    <button
                      className="row-action"
                      onClick={() => openDetail(person)}
                    >
                      View details
                    </button>
                    <button className="row-action" onClick={() => openEdit(person)}>
                      Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
function AssetsRegister({
  assets,
  allAssets,
  locations,
  query,
  setQuery,
  section,
  setSection,
  status,
  setStatus,
  location,
  setLocation,
  setModal,
  openDetail,
  openEdit,
  markJunk,
}) {
  const sections = [
    ["All", allAssets.length],
    ["Laptop", allAssets.filter((a) => a.category === "Laptop").length],
    ["Phone", allAssets.filter((a) => a.category === "Phone").length],
    ["Tablet", allAssets.filter((a) => a.category === "Tablet").length],
  ];
  return (
    <>
      <div className="asset-sections">
        {sections.map(([name, count]) => (
          <button
            className={section === name ? "selected" : ""}
            onClick={() => setSection(name)}
            key={name}
          >
            {name === "All" ? "All assets" : `${name}s`} <b>{count}</b>
          </button>
        ))}
      </div>
      <section className="register">
        <div className="section-heading">
          <div>
            <h2>{section === "All" ? "All assets" : `${section}s`}</h2>
            <p>{assets.length} records shown</p>
          </div>
          <button className="primary" onClick={() => setModal("asset")}>
            + Add asset
          </button>
        </div>
        <div className="toolbar enhanced-toolbar">
          <label className="search">
            <span>⌕</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search asset code, serial, model or owner..."
            />
          </label>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option>All</option>
            {[
              "Assigned",
              "In stock",
              "Returned",
              "Repair",
              "Retired",
              "Junk",
            ].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          >
            <option>All</option>
            {locations.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="table-wrap asset-table-wrap">
          <table className="asset-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Category</th>
                <th>Owner</th>
                <th>Location</th>
                <th>Serial / IMEI</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <strong>
                      {asset.make} {asset.model}
                    </strong>
                    <small>{asset.id}</small>
                  </td>
                  <td>{asset.category}</td>
                  <td>{asset.assignee}</td>
                  <td>{asset.site}</td>
                  <td className="serial">
                    {asset.serial || asset.imei || "—"}
                  </td>
                  <td>
                    <span
                      className={`status status-${asset.status.toLowerCase().replace(" ", "-")}`}
                    >
                      <i />
                      {asset.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="row-action"
                      disabled={asset.status === "Junk"}
                      onClick={() => setModal("assign")}
                    >
                      Assign
                    </button>
                    <button
                      className="row-action"
                      onClick={() => openDetail(asset)}
                    >
                      History
                    </button>
                    <button className="row-action" onClick={() => openEdit(asset)}>
                      Edit
                    </button>
                    <button
                      className="row-action danger-row"
                      disabled={asset.status === "Junk"}
                      onClick={() => markJunk(asset)}
                    >
                      Mark junk
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function HistoryTable({ history }) {
  return (
    <section className="register">
      <div className="section-heading">
        <div>
          <h2>Complete history</h2>
          <p>{history.length} ownership and lifecycle events</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Asset</th>
              <th>Person</th>
              <th>Action</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, index) => (
              <tr key={entry.id || index}>
                <td>
                  {new Date(entry.assigned_at).toLocaleDateString("en-ZA")}
                </td>
                <td>{entry.asset_code || entry.asset_id}</td>
                <td>{entry.person_name || "—"}</td>
                <td>{entry.action}</td>
                <td>{entry.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DomainsRegister({ domains, allDomains, query, setQuery, setModal, openDetail }) {
  return (
    <section className="register">
      <div className="section-heading">
        <div>
          <h2>Domain register</h2>
          <p>{domains.length} of {allDomains.length} domains shown</p>
        </div>
        <button className="primary" onClick={() => setModal("domain")}>+ Add domain</button>
      </div>
      <div className="toolbar enhanced-toolbar">
        <label className="search">
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search domain or provider..." />
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Domain</th><th>Provider / company</th><th>Transfer date in-house</th><th>Renewal date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <tr key={domain.id}>
                <td><strong>{domain.domain}</strong><small>{domain.id}</small></td>
                <td>{domain.provider}</td>
                <td>{domain.transfer_date || "—"}</td>
                <td>{domain.renewal_date || "—"}</td>
                <td><button className="row-action" onClick={() => openDetail(domain)}>History</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DetailPanel({ detail, assets, history, domainHistory, documents, close, viewPdf }) {
  const isPerson = detail.type === "person";
  const isDomain = detail.type === "domain";
  const value = detail.value;
  const relatedAssets = isPerson
    ? assets.filter((asset) => asset.assignee === value.name)
    : [];
  const relatedHistory = history.filter((entry) =>
    isPerson
      ? entry.person_id === value.id || entry.person_name === value.name
      : entry.asset_id === value.supabaseId || entry.asset_code === value.id,
  );
  const relatedDocuments = isPerson
    ? documents.filter(
        (document) =>
          document.person_id === value.id ||
          document.employee_name === value.name,
      )
    : [];
  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="history-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="close" onClick={close}>
          x
        </button>
        <span className="detail-label">
          {isPerson ? "Person record" : isDomain ? "Domain record" : "Asset record"}
        </span>
        <h2>{isPerson ? value.name : isDomain ? value.domain : `${value.make} ${value.model}`}</h2>
        {isDomain && (
          <section>
            <h3>Domain details</h3>
            <div className="mini-list">
              <div><strong>Provider / company</strong><span>{value.provider}</span></div>
              <div><strong>Transfer date in-house</strong><span>{value.transfer_date || "Not recorded"}</span></div>
              <div><strong>Renewal date</strong><span>{value.renewal_date || "Not recorded"}</span></div>
            </div>
          </section>
        )}
        {isPerson && (
          <>
            <section>
              <h3>Current assets</h3>
              {relatedAssets.length ? (
                <div className="mini-list">
                  {relatedAssets.map((asset) => (
                    <div key={asset.id}>
                      <strong>
                        {asset.make} {asset.model}
                      </strong>
                      <span>
                        {asset.id} · {asset.category}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-note">No assets currently assigned.</p>
              )}
            </section>
            <section>
              <h3>Acknowledgment PDFs</h3>
              {relatedDocuments.length ? (
                <div className="document-list">
                  {relatedDocuments.map((document) => (
                    <div key={document.id}>
                      <div>
                        <strong>
                          {document.title || "Signed acknowledgment"}
                        </strong>
                        <span>
                          {new Date(
                            document.issue_date || document.created_at,
                          ).toLocaleDateString("en-ZA")}
                        </span>
                      </div>
                      <button
                        className="row-action"
                        onClick={() => viewPdf(document)}
                      >
                        View PDF
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-note">No PDFs uploaded yet.</p>
              )}
            </section>
          </>
        )}
        <section>
          <h3>{isDomain ? "Domain history" : isPerson ? "Device history" : "Owner history"}</h3>
          {(isDomain ? domainHistory.filter((entry) => entry.domain_id === value.id) : relatedHistory).length ? (
            <div className="history-list">
              {(isDomain ? domainHistory.filter((entry) => entry.domain_id === value.id) : relatedHistory).map((entry, index) => (
                <div key={entry.id || index}>
                  <span className="history-dot" />
                  <div>
                    <strong>{entry.action}</strong>
                    <p>
                      {isDomain
                        ? `${entry.provider || value.provider} · renewal ${entry.renewal_date || "not set"}`
                        : isPerson
                        ? entry.asset_code || entry.asset_id
                        : entry.person_name || "No person"}{" "}
                      ·{" "}
                      {new Date(entry.recorded_at || entry.assigned_at).toLocaleDateString("en-ZA")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-note">No history recorded yet.</p>
          )}
        </section>
      </div>
    </div>
  );
}
function RecordModal({ type, record, people, assets, locations, close, submit }) {
  const isPersonForm = type === "person" || type === "editPerson";
  const isAssetForm = type === "asset" || type === "editAsset";
  const isEditing = type === "editPerson" || type === "editAsset";
  return (
    <div className="modal-backdrop" onClick={close}>
      <form
        className="form-card"
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="close" onClick={close}>
          x
        </button>
        <span className="detail-label">
          {type === "assign" ? "Assignment" : isEditing ? "Edit record" : "New record"}
        </span>
        <h2>
          {type === "assign"
            ? "Assign asset"
            : isPersonForm
              ? isEditing ? "Edit person" : "Add person"
              : type === "domain"
                ? "Add domain"
              : isEditing ? "Edit asset" : "Add asset"}
        </h2>
        {isPersonForm ? (
          <div className="form-grid">
            {isEditing && (
              <>
                <input type="hidden" name="recordId" value={record?.id || ""} readOnly />
                <input type="hidden" name="currentName" value={record?.name || ""} readOnly />
              </>
            )}
            <label>
              Name
              <input required name="name" defaultValue={record?.name || ""} />
            </label>
            <label>
              Employee number
              <input name="employeeNumber" defaultValue={record?.employeeNumber || record?.employee_number || ""} />
            </label>
            <label>
              Department
              <input name="department" defaultValue={record?.department || ""} />
            </label>
            <label>
              Position
              <input name="position" defaultValue={record?.position || ""} />
            </label>
            <label>
              Email
              <input type="email" name="email" defaultValue={record?.email || ""} />
            </label>
          </div>
        ) : type === "domain" ? (
          <div className="form-grid">
            <label>
              Domain
              <input required name="domain" placeholder="example.com" />
            </label>
            <label>
              Provider / company
              <input required name="provider" />
            </label>
            <label>
              Transfer date in-house
              <input type="date" name="transferDate" />
            </label>
            <label>
              Renewal date
              <input type="date" name="renewalDate" />
            </label>
          </div>
        ) : isAssetForm ? (
          <div className="form-grid">
            {isEditing && (
              <>
                <input type="hidden" name="recordId" value={record?.supabaseId || record?.id || ""} readOnly />
                <input type="hidden" name="currentStatus" value={record?.status || "In stock"} readOnly />
                <input type="hidden" name="currentAssignee" value={record?.assignee || "Unassigned"} readOnly />
              </>
            )}
            <label>
              Category
              <select name="category" defaultValue={record?.category || "Laptop"}>
                <option>Laptop</option>
                <option>Phone</option>
                <option>Tablet</option>
                <option>Printer</option>
                <option>Desktop</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Location
              <input name="site" list="locations" required defaultValue={record?.site || ""} />
              <datalist id="locations">
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </datalist>
            </label>
            <label>
              Make
              <input required name="make" defaultValue={record?.make || ""} />
            </label>
            <label>
              Model
              <input required name="model" defaultValue={record?.model || ""} />
            </label>
            <label>
              Serial number
              <input name="serial" defaultValue={record?.serial || ""} />
            </label>
            <label>
              IMEI
              <input name="imei" defaultValue={record?.imei || ""} />
            </label>
            <label>
              Purchase date
              <input type="date" name="purchaseDate" defaultValue={record?.purchase_date || ""} />
            </label>
            <label>
              Purchase value
              <input type="number" min="0" step="0.01" name="purchaseValue" placeholder="0.00" defaultValue={record?.purchase_value ?? ""} />
            </label>
            <label className="checkbox-field">
              <input type="checkbox" name="onContract" defaultChecked={Boolean(record?.on_contract)} />
              <span>On contract</span>
            </label>
            <label>
              Condition
              <select name="condition" defaultValue={record?.condition || "Good"}>
                <option>New</option>
                <option>Good</option>
                <option>Used</option>
                <option>Needs attention</option>
              </select>
            </label>
          </div>
        ) : (
          <div className="form-grid">
            <label>
              Asset
              <select name="assetId">
                {assets
                  .filter((asset) => asset.status !== "Junk")
                  .map((asset) => (
                    <option value={asset.id} key={asset.id}>
                      {asset.id} - {asset.make} {asset.model}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Person
              <select name="personId">
                {people.map((person) => (
                  <option value={person.id} key={person.id}>
                    {person.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
        <button className="primary full">Save</button>
      </form>
    </div>
  );
}
export default App;
