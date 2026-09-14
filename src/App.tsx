import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import "./App.css";
import "./index.css";
import "./rail.css";
import "./responsive.css";
import { LoginScreen } from "./components/LoginScreen";
import { exportTransactionsExcel } from "./lib/exportExcel";
import { exportTransactionsPdf } from "./lib/exportPdf";
import { supabase } from "./lib/supabaseClient";

type View = "overview" | "transactions" | "reports" | "profile";
type Range = "This month" | "Last month" | "Custom";
type FullTransaction = {
  id: string;
  date: string;
  mealSlot: string;
  vendor: string;
  planType: string;
  pax: number;
  basePrice: number;
  deliveryFee: number;
  courierType: string;
  shippingDistanceKm: number;
  packagingFee: number;
  packagingDeposit: number;
  depositReturned: boolean;
  addonItems: string;
  addonPrice: number;
  voucherCode: string;
  discount: number;
  paymentStatus: string;
  paymentMethod: string;
  onTimeStatus: string;
  qualityRating: number;
  packagingCondition: string;
  menuNotes: string;
};

type FormState = Omit<FullTransaction, "id">;
const emptyForm: FormState = {
  date: "2026-09-14",
  mealSlot: "Lunch",
  vendor: "",
  planType: "Standard",
  pax: 1,
  basePrice: 0,
  deliveryFee: 0,
  courierType: "Internal Provider",
  shippingDistanceKm: 0,
  packagingFee: 0,
  packagingDeposit: 0,
  depositReturned: false,
  addonItems: "",
  addonPrice: 0,
  voucherCode: "",
  discount: 0,
  paymentStatus: "Unpaid / Payable",
  paymentMethod: "Bank Transfer",
  onTimeStatus: "On-Time",
  qualityRating: 5,
  packagingCondition: "Intact",
  menuNotes: "",
};
const actualTransactions: FullTransaction[] = Array.from(
  { length: 19 },
  (_, offset) => {
    const date = `2026-09-${String(offset + 7).padStart(2, "0")}`;
    const ricePurchase = offset === 5;
    return [
      {
        id: `kpr-${date}-morning`,
        date,
        mealSlot: "Breakfast",
        vendor: "KPR",
        planType: "Daily Pack",
        pax: 1,
        basePrice: 11000,
        deliveryFee: 0,
        courierType: "Internal Provider",
        shippingDistanceKm: 0,
        packagingFee: 0,
        packagingDeposit: 0,
        depositReturned: false,
        addonItems: ricePurchase ? "Beras 5 kg" : "",
        addonPrice: ricePurchase ? 85000 : 0,
        voucherCode: "",
        discount: 0,
        paymentStatus: "Paid",
        paymentMethod: "Cash",
        onTimeStatus: "On-Time",
        qualityRating: 5,
        packagingCondition: "Intact",
        menuNotes: ricePurchase
          ? "Pembelian beras untuk stok, 12 September 2026"
          : "Pengantaran harian KPR",
      },
      {
        id: `kpr-${date}-evening`,
        date,
        mealSlot: "Dinner",
        vendor: "KPR",
        planType: "Daily Pack",
        pax: 1,
        basePrice: 11000,
        deliveryFee: 0,
        courierType: "Internal Provider",
        shippingDistanceKm: 0,
        packagingFee: 0,
        packagingDeposit: 0,
        depositReturned: false,
        addonItems: "",
        addonPrice: 0,
        voucherCode: "",
        discount: 0,
        paymentStatus: "Paid",
        paymentMethod: "Cash",
        onTimeStatus: "On-Time",
        qualityRating: 5,
        packagingCondition: "Intact",
        menuNotes: "Pengantaran harian KPR",
      },
    ];
  },
).flat();

function netTotal(
  item: Pick<
    FullTransaction,
    | "pax"
    | "basePrice"
    | "deliveryFee"
    | "packagingFee"
    | "addonPrice"
    | "discount"
  >,
) {
  return (
    item.pax * item.basePrice +
    item.deliveryFee +
    item.packagingFee +
    item.addonPrice -
    item.discount
  );
}
function money(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
function dateText(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}
function slug(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.|\.$/g, "") || "catering-user"
  );
}
function inputNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}
function mapDatabaseTransaction(row: Record<string, unknown>): FullTransaction {
  return {
    id: String(row.id),
    date: String(row.date),
    mealSlot: String(row.meal_slot),
    vendor: String(row.vendor),
    planType: String(row.plan_type),
    pax: Number(row.pax),
    basePrice: Number(row.base_price),
    deliveryFee: Number(row.delivery_fee),
    courierType: String(row.courier_type),
    shippingDistanceKm: Number(row.shipping_distance_km),
    packagingFee: Number(row.packaging_fee),
    packagingDeposit: Number(row.packaging_deposit),
    depositReturned: Boolean(row.deposit_returned),
    addonItems: String(row.addon_items),
    addonPrice: Number(row.addon_price),
    voucherCode: String(row.voucher_code),
    discount: Number(row.discount),
    paymentStatus: String(row.payment_status),
    paymentMethod: String(row.payment_method),
    onTimeStatus: String(row.on_time_status),
    qualityRating: Number(row.quality_rating),
    packagingCondition: String(row.packaging_condition),
    menuNotes: String(row.menu_notes),
  };
}
function toDatabaseTransaction(item: FullTransaction, userId: string) {
  return {
    user_id: userId,
    date: item.date,
    meal_slot: item.mealSlot,
    vendor: item.vendor,
    plan_type: item.planType,
    pax: item.pax,
    base_price: item.basePrice,
    delivery_fee: item.deliveryFee,
    courier_type: item.courierType,
    shipping_distance_km: item.shippingDistanceKm,
    packaging_fee: item.packagingFee,
    packaging_deposit: item.packagingDeposit,
    deposit_returned: item.depositReturned,
    addon_items: item.addonItems,
    addon_price: item.addonPrice,
    voucher_code: item.voucherCode,
    discount: item.discount,
    payment_status: item.paymentStatus,
    payment_method: item.paymentMethod,
    on_time_status: item.onTimeStatus,
    quality_rating: item.qualityRating,
    packaging_condition: item.packagingCondition,
    menu_notes: item.menuNotes,
  };
}
function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  return hour < 5
    ? "Good night"
    : hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
}
function formatToday(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
    .format(date)
    .toUpperCase();
}

function App() {
  const [sessionReady, setSessionReady] = useState(!supabase);
  const [authenticated, setAuthenticated] = useState(false);
  const [view, setView] = useState<View>("overview");
  const [range, setRange] = useState<Range>("This month");
  const [customStart, setCustomStart] = useState("2026-09-01");
  const [customEnd, setCustomEnd] = useState("2026-09-30");
  const [search, setSearch] = useState("");
  const [mealFilter, setMealFilter] = useState("All meals");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("Catering User");
  const [username, setUsername] = useState("catering-user");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [budgetCap, setBudgetCap] = useState(2500000);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let transactionChannel: ReturnType<typeof client.channel> | undefined;
    client.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (user) {
        const name =
          user.user_metadata.full_name ??
          user.user_metadata.name ??
          user.email?.split("@")[0] ??
          "Catering User";
        setDisplayName(name);
        setUsername(user.user_metadata.username ?? slug(name));
        setAvatarUrl(user.user_metadata.avatar_url ?? "");
        const { data: rows, error: rowsError } = await client
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });
        if (rowsError) {
          setMessage(`Database: ${rowsError.message}`);
          setTransactions([]);
        } else if (rows?.length) {
          const seedKeys = new Set(
            actualTransactions.map(
              (item) => `${item.date}|${item.mealSlot}|${item.vendor}`,
            ),
          );
          const seenSeedKeys = new Set<string>();
          const duplicateIds: string[] = [];
          const existing = rows
            .map(mapDatabaseTransaction)
            .filter((item) => {
              const key = `${item.date}|${item.mealSlot}|${item.vendor}`;
              const isSeed = seedKeys.has(key);
              if (!isSeed || !seenSeedKeys.has(key)) {
                if (isSeed) seenSeedKeys.add(key);
                return true;
              }
              duplicateIds.push(item.id);
              return false;
            });
          if (duplicateIds.length)
            await client.from("transactions").delete().in("id", duplicateIds);
          const existingKeys = new Set(
            existing.map((item) => `${item.date}|${item.mealSlot}|${item.vendor}`),
          );
          const missing = actualTransactions.filter(
            (item) =>
              !existingKeys.has(`${item.date}|${item.mealSlot}|${item.vendor}`),
          );
          if (missing.length) {
            const seeded = await client
              .from("transactions")
              .insert(missing.map((item) => toDatabaseTransaction(item, user.id)))
              .select("*");
            if (seeded.error) {
              setMessage(`Data sampai 25 September gagal ditambahkan: ${seeded.error.message}`);
              setTransactions(existing);
            } else {
              setTransactions(
                seeded.data?.length
                  ? [...existing, ...seeded.data.map(mapDatabaseTransaction)]
                  : existing,
              );
            }
          } else setTransactions(existing);
        } else {
          const payload = actualTransactions.map((item) =>
            toDatabaseTransaction(item, user.id),
          );
          const seeded = await client
            .from("transactions")
            .insert(payload)
            .select("*");
          if (seeded.error) {
            setMessage(`Data awal gagal ditambahkan: ${seeded.error.message}`);
            setTransactions(actualTransactions);
          } else if (seeded.data?.length)
            setTransactions(seeded.data.map(mapDatabaseTransaction));
          else setTransactions(actualTransactions);
        }
        transactionChannel = client
          .channel(`transactions:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "transactions",
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              if (payload.eventType === "DELETE") {
                const deletedId = String(
                  (payload.old as Record<string, unknown>).id,
                );
                setTransactions((current) =>
                  current.filter((item) => item.id !== deletedId),
                );
                return;
              }
              const incoming = mapDatabaseTransaction(
                payload.new as Record<string, unknown>,
              );
              setTransactions((current) => {
                const exists = current.some((item) => item.id === incoming.id);
                return exists
                  ? current.map((item) =>
                      item.id === incoming.id ? incoming : item,
                    )
                  : [incoming, ...current];
              });
            },
          )
          .subscribe();
        const { data: profile } = await client
          .from("profiles")
          .select("display_name, username, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (profile) {
          setDisplayName(profile.display_name);
          setUsername(profile.username);
          setAvatarUrl(profile.avatar_url ?? "");
        }
        const { data: budget } = await client
          .from("budgets")
          .select("monthly_cap")
          .eq("user_id", user.id)
          .maybeSingle();
        if (budget?.monthly_cap) setBudgetCap(Number(budget.monthly_cap));
      }
      setAuthenticated(Boolean(data.session));
      setSessionReady(true);
    });
    const { data: listener } = client.auth.onAuthStateChange(
      (_event, session) => setAuthenticated(Boolean(session)),
    );
    return () => {
      listener.subscription.unsubscribe();
      if (transactionChannel) void client.removeChannel(transactionChannel);
    };
  }, []);

  const filtered = useMemo(
    () =>
      transactions.filter((item) => {
        const searchMatch = [
          item.vendor,
          item.menuNotes,
          item.addonItems,
          item.planType,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const dateMatch =
          range === "Custom"
            ? item.date >= customStart && item.date <= customEnd
            : range === "This month"
              ? item.date.startsWith("2026-09")
              : item.date.startsWith("2026-08");
        return (
          searchMatch &&
          dateMatch &&
          (mealFilter === "All meals" || item.mealSlot === mealFilter) &&
          (statusFilter === "All statuses" ||
            item.paymentStatus === statusFilter)
        );
      }),
    [
      transactions,
      search,
      range,
      customStart,
      customEnd,
      mealFilter,
      statusFilter,
    ],
  );
  const spend = filtered.reduce((sum, item) => sum + netTotal(item), 0);
  const pax = filtered.reduce((sum, item) => sum + item.pax, 0);
  const deposits = filtered
    .filter((item) => item.packagingDeposit > 0 && !item.depositReturned)
    .reduce((sum, item) => sum + item.packagingDeposit, 0);
  const average = pax ? spend / pax : 0;

  function editEntry(item?: FullTransaction) {
    setForm(item ? { ...item } : { ...emptyForm });
    setSelected(item?.id ?? null);
    setIsEntryOpen(true);
  }
  async function saveEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!form.vendor.trim() || form.pax <= 0 || form.basePrice < 0) {
      setMessage("Vendor wajib diisi dan pax harus lebih dari 0.");
      return;
    }
    const id = selected ?? `local-${Date.now()}`;
    const next = { ...form, id };
    setTransactions((current) =>
      selected
        ? current.map((item) => (item.id === selected ? next : item))
        : [next, ...current],
    );
    if (supabase) {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        const payload = {
          user_id: user.id,
          date: form.date,
          meal_slot: form.mealSlot,
          vendor: form.vendor,
          plan_type: form.planType,
          pax: form.pax,
          base_price: form.basePrice,
          delivery_fee: form.deliveryFee,
          courier_type: form.courierType,
          shipping_distance_km: form.shippingDistanceKm,
          packaging_fee: form.packagingFee,
          packaging_deposit: form.packagingDeposit,
          deposit_returned: form.depositReturned,
          addon_items: form.addonItems,
          addon_price: form.addonPrice,
          voucher_code: form.voucherCode,
          discount: form.discount,
          payment_status: form.paymentStatus,
          payment_method: form.paymentMethod,
          on_time_status: form.onTimeStatus,
          quality_rating: form.qualityRating,
          packaging_condition: form.packagingCondition,
          menu_notes: form.menuNotes,
        };
        const result = selected
          ? await supabase
              .from("transactions")
              .update(payload)
              .eq("id", selected)
          : await supabase.from("transactions").insert(payload).select("*").single();
        if (!selected && result.data) {
          const saved = mapDatabaseTransaction(result.data);
          setTransactions((current) => [
            saved,
            ...current.filter((item) => item.id !== id),
          ]);
        }
        if (result.error) setMessage(`Database: ${result.error.message}`);
      }
    }
    setIsEntryOpen(false);
    setSelected(null);
  }
  async function removeEntry(id: string) {
    setTransactions((current) => current.filter((item) => item.id !== id));
    if (supabase && !id.startsWith("sample") && !id.startsWith("local"))
      await supabase.from("transactions").delete().eq("id", id);
  }
  async function markReturned(item: FullTransaction) {
    setTransactions((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, depositReturned: true } : row,
      ),
    );
    if (supabase && !item.id.startsWith("sample"))
      await supabase
        .from("transactions")
        .update({ deposit_returned: true })
        .eq("id", item.id);
  }
  function exportJson() {
    download(
      JSON.stringify(filtered, null, 2),
      "application/json",
      "catering-pulse.json",
    );
  }
  function download(content: string, type: string, filename: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  function exportRows() {
    return filtered.map((item) => ({
      date: item.date,
      meal: item.mealSlot,
      vendor: item.vendor,
      planType: item.planType,
      pax: item.pax,
      basePrice: item.basePrice,
      deliveryFee: item.deliveryFee,
      courierType: item.courierType,
      shippingDistanceKm: item.shippingDistanceKm,
      packagingFee: item.packagingFee,
      packagingDeposit: item.packagingDeposit,
      depositStatus:
        item.packagingDeposit === 0
          ? "N/A"
          : item.depositReturned
            ? "Returned"
            : "Held",
      addonItems: item.addonItems,
      addonPrice: item.addonPrice,
      voucherCode: item.voucherCode,
      discount: item.discount,
      paymentStatus: item.paymentStatus,
      paymentMethod: item.paymentMethod,
      onTimeStatus: item.onTimeStatus,
      qualityRating: item.qualityRating,
      packagingCondition: item.packagingCondition,
      netTotal: netTotal(item),
      menuNotes: item.menuNotes,
    }));
  }
  function exportPdf() {
    exportTransactionsPdf(exportRows(), {
      periodLabel:
        range === "Custom" ? `${customStart} to ${customEnd}` : range,
      budgetCap,
      userName: displayName,
    });
  }
  async function exportExcel() {
    await exportTransactionsExcel(exportRows(), {
      periodLabel: range,
      budgetCap,
      userName: displayName,
    });
  }
  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = username.toLowerCase().trim();
    const budgetInput = event.currentTarget.elements.namedItem("budgetCap");
    const value =
      budgetInput instanceof HTMLInputElement
        ? Number(budgetInput.value)
        : budgetCap;
    if (!Number.isFinite(value) || value < 0) {
      setMessage("Budget cap harus berupa angka 0 atau lebih.");
      return;
    }
    setBudgetCap(value);
    setProfileOpen(false);
    if (!supabase) {
      setMessage(
        "Budget tersimpan di sesi lokal. Konfigurasi Supabase untuk menyimpannya lintas perangkat.",
      );
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setMessage("Session login tidak ditemukan.");
      return;
    }
    const budgetResult = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: user.id,
          monthly_cap: value,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
    const profileResult = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          display_name: displayName.trim(),
          username: clean,
          avatar_url: avatarUrl.trim(),
        },
        { onConflict: "id" },
      );
    if (budgetResult.error && profileResult.error)
      setMessage(
        `Budget dan profile gagal disimpan. Jalankan schema.sql terbaru di Supabase.`,
      );
    else if (budgetResult.error)
      setMessage(
        `Profile tersimpan, tetapi budget gagal: ${budgetResult.error.message}`,
      );
    else if (profileResult.error)
      setMessage(
        `Budget tersimpan. Profile belum tersimpan karena tabel profiles belum dibuat; jalankan schema.sql terbaru.`,
      );
    else setMessage("Profile dan budget berhasil disimpan.");
  }

  if (!sessionReady)
    return (
      <main className="auth-shell">
        <p>Loading session...</p>
      </main>
    );
  if (!authenticated)
    return <LoginScreen onAuthenticated={() => setAuthenticated(true)} />;
  const navItems: { id: View; label: string; icon: typeof LayoutDashboard }[] =
    [
      { id: "overview", label: "Overview", icon: LayoutDashboard },
      { id: "transactions", label: "Transactions", icon: Receipt },
      { id: "reports", label: "Reports & exports", icon: BarChart3 },
      { id: "profile", label: "Profile", icon: UserRound },
    ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand" title="Catering Pulse">
          <span className="brand-mark">
            <Utensils size={18} />
          </span>
          <span>
            Catering<span>Pulse</span>
          </span>
        </div>
        <div className="workspace-label">PERSONAL WORKSPACE</div>
        <nav className="nav-list">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              title={label}
              aria-label={label}
              className={`nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
            >
              <Icon size={17} />
              {label}
              {id === "transactions" && (
                <span className="nav-count">{transactions.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="nav-item"
            title="Workspace settings"
            aria-label="Workspace settings"
            onClick={() => setProfileOpen(true)}
          >
            <Settings2 size={17} />
            Workspace settings
          </button>
          <button
            className="nav-item logout-button"
            title="Log out"
            aria-label="Log out"
            onClick={() => void supabase?.auth.signOut()}
          >
            <LogOut size={17} />
            Log out
          </button>
          <button
            className="profile profile-button"
            title={`Profile: ${displayName}`}
            aria-label={`Profile: ${displayName}`}
            onClick={() => setView("profile")}
          >
            <div className="avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                displayName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div>
              <strong>{displayName}</strong>
              <small>@{username}</small>
            </div>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{formatToday()}</p>
            <h1>
              {view === "overview"
                ? `${getTimeGreeting()}, ${displayName.split(" ")[0]}`
                : navItems.find((item) => item.id === view)?.label}
            </h1>
          </div>
          <div className="top-actions">
            <button
              className="secondary-button"
              title="Open filters"
              onClick={() => setView("transactions")}
            >
              <Filter size={15} />
              Filters
            </button>
            <button
              className="secondary-button"
              title="Sync transactions from Supabase"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={15} />
              Sync
            </button>
            <button className="secondary-button" onClick={exportJson}>
              <Download size={15} />
              JSON
            </button>
            <button className="secondary-button" onClick={exportPdf}>
              PDF
            </button>
            <button
              className="secondary-button"
              onClick={() => void exportExcel()}
            >
              Excel
            </button>
            <button className="primary-button" onClick={() => editEntry()}>
              <Plus size={17} />
              Add entry
            </button>
          </div>
        </header>
        {message && (
          <div className="notice">
            {message}
            <button onClick={() => setMessage("")}>
              <X size={14} />
            </button>
          </div>
        )}
        {view === "profile" ? (
          <ProfileView
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
            setDisplayName={setDisplayName}
            setUsername={setUsername}
            setAvatarUrl={setAvatarUrl}
            onSave={saveProfile}
          />
        ) : view === "reports" ? (
          <ReportsView
            filtered={filtered}
            range={range}
            setRange={setRange}
            customStart={customStart}
            customEnd={customEnd}
            setCustomStart={setCustomStart}
            setCustomEnd={setCustomEnd}
            spend={spend}
            exportPdf={exportPdf}
            exportExcel={exportExcel}
          />
        ) : (
          <>
            <FilterBar
              search={search}
              setSearch={setSearch}
              range={range}
              setRange={setRange}
              mealFilter={mealFilter}
              setMealFilter={setMealFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              customStart={customStart}
              customEnd={customEnd}
              setCustomStart={setCustomStart}
              setCustomEnd={setCustomEnd}
            />
            {view === "overview" && (
              <Overview
                spend={spend}
                average={average}
                pax={pax}
                deposits={deposits}
                filtered={filtered}
                setView={setView}
              />
            )}
            <TransactionsView
              transactions={filtered}
              onEdit={editEntry}
              onDelete={removeEntry}
              onReturn={markReturned}
              selected={selected}
              setSelected={setSelected}
            />
          </>
        )}
        {isEntryOpen && (
          <EntryModal
            form={form}
            setForm={setForm}
            selected={selected}
            onSubmit={saveEntry}
            onClose={() => {
              setIsEntryOpen(false);
              setSelected(null);
            }}
          />
        )}{" "}
        {profileOpen && (
          <ProfileModal
            displayName={displayName}
            username={username}
            avatarUrl={avatarUrl}
            budgetCap={budgetCap}
            setDisplayName={setDisplayName}
            setUsername={setUsername}
            setAvatarUrl={setAvatarUrl}
            onSubmit={saveProfile}
            onClose={() => setProfileOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

function FilterBar(props: {
  search: string;
  setSearch: (value: string) => void;
  range: Range;
  setRange: (value: Range) => void;
  mealFilter: string;
  setMealFilter: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  customStart: string;
  customEnd: string;
  setCustomStart: (value: string) => void;
  setCustomEnd: (value: string) => void;
}) {
  return (
    <section className="filter-bar">
      <div className="search-box">
        <Search size={16} />
        <input
          value={props.search}
          onChange={(event) => props.setSearch(event.target.value)}
          placeholder="Search vendor, notes, plan..."
        />
      </div>
      <div className="filter-group">
        <CalendarDays size={15} />
        {(["This month", "Last month", "Custom"] as Range[]).map((item) => (
          <button
            className={props.range === item ? "selected" : ""}
            key={item}
            onClick={() => props.setRange(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <select
        value={props.mealFilter}
        onChange={(event) => props.setMealFilter(event.target.value)}
      >
        <option>All meals</option>
        <option>Breakfast</option>
        <option>Lunch</option>
        <option>Dinner</option>
        <option>Snack</option>
      </select>
      <select
        value={props.statusFilter}
        onChange={(event) => props.setStatusFilter(event.target.value)}
      >
        <option>All statuses</option>
        <option>Paid</option>
        <option>Unpaid / Payable</option>
        <option>Pending Reimbursement</option>
        <option>Deposit Deduction</option>
      </select>
      {props.range === "Custom" && (
        <div className="date-inputs">
          <input
            type="date"
            value={props.customStart}
            onChange={(event) => props.setCustomStart(event.target.value)}
          />
          <span>to</span>
          <input
            type="date"
            value={props.customEnd}
            onChange={(event) => props.setCustomEnd(event.target.value)}
          />
        </div>
      )}
      <button
        className="filter-reset"
        onClick={() => {
          props.setSearch("");
          props.setMealFilter("All meals");
          props.setStatusFilter("All statuses");
          props.setRange("This month");
        }}
      >
        <Filter size={15} />
        Reset
      </button>
    </section>
  );
}
function Overview({
  spend,
  average,
  pax,
  deposits,
  filtered,
  setView,
}: {
  spend: number;
  average: number;
  pax: number;
  deposits: number;
  filtered: FullTransaction[];
  setView: (view: View) => void;
}) {
  return (
    <>
      <section className="summary-row">
        <article className="hero-card">
          <span className="metric-label">REPORT SPEND</span>
          <strong>{money(spend)}</strong>
          <p>{filtered.length} transactions in the selected period</p>
          <span className="hero-mark">
            <ArrowDownRight size={20} />
          </span>
        </article>
        <Metric
          title="AVERAGE COST / PAX"
          value={money(average)}
          icon={<Utensils size={16} />}
          detail="Across selected report"
        />
        <Metric
          title="TOTAL PAX SERVED"
          value={String(pax)}
          icon={<Sparkles size={16} />}
          detail="Meals accounted for"
        />
        <Metric
          title="ACTIVE DEPOSITS"
          value={money(deposits)}
          icon={<CircleDollarSign size={16} />}
          detail="Awaiting return"
        />
      </section>
      <section className="overview-grid">
        <article className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SPEND MIX</p>
              <h2>Where your money goes</h2>
            </div>
            <button className="text-button" onClick={() => setView("reports")}>
              Open report <ArrowUpRight size={15} />
            </button>
          </div>
          <div className="mix-bars">
            <div style={{ height: "82%" }}>
              <span>Food</span>
            </div>
            <div style={{ height: "38%" }}>
              <span>Logistics</span>
            </div>
            <div style={{ height: "27%" }}>
              <span>Add-ons</span>
            </div>
            <div style={{ height: "15%" }}>
              <span>Discounts</span>
            </div>
          </div>
          <div className="chart-caption">
            <span>
              <i className="dot navy" />
              Food & meals
            </span>
            <span>
              <i className="dot amber" />
              Logistics
            </span>
            <span>
              <i className="dot slate" />
              Add-ons
            </span>
          </div>
        </article>
        <article className="panel quick-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">QUICK ACTIONS</p>
              <h2>Keep the log current</h2>
            </div>
            <MoreHorizontal size={17} />
          </div>
          <button
            className="quick-action"
            onClick={() => setView("transactions")}
          >
            <Receipt size={17} />
            <span>
              <strong>Review transactions</strong>
              <small>Search, edit, and reconcile entries</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
          <button className="quick-action" onClick={() => setView("reports")}>
            <BarChart3 size={17} />
            <span>
              <strong>Build a report</strong>
              <small>Choose a period and export it</small>
            </span>
            <ArrowUpRight size={15} />
          </button>
          <button className="quick-action">
            <Archive size={17} />
            <span>
              <strong>Deposit tracker</strong>
              <small>
                {
                  filtered.filter(
                    (item) => item.packagingDeposit && !item.depositReturned,
                  ).length
                }{" "}
                items need attention
              </small>
            </span>
            <ArrowUpRight size={15} />
          </button>
        </article>
      </section>
    </>
  );
}
function Metric({
  title,
  value,
  icon,
  detail,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  detail: string;
}) {
  return (
    <article className="stat-card">
      <div className="metric-top">
        <span className="metric-label">{title}</span>
        <span className="metric-icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  );
}
function TransactionsView({
  transactions,
  onEdit,
  onDelete,
  onReturn,
  selected,
  setSelected,
}: {
  transactions: FullTransaction[];
  onEdit: (item: FullTransaction) => void;
  onDelete: (id: string) => void;
  onReturn: (item: FullTransaction) => void;
  selected: string | null;
  setSelected: (id: string | null) => void;
}) {
  return (
    <section className="panel transactions-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">TRANSACTION LOG</p>
          <h2>Detailed catering activity</h2>
        </div>
        <span className="record-count">{transactions.length} records</span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>
                <input type="checkbox" />
              </th>
              <th>Date</th>
              <th>Vendor</th>
              <th>Meal</th>
              <th>Pax</th>
              <th>Payment</th>
              <th>Quality</th>
              <th className="right">Net total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {transactions.map((item) => (
              <tr
                key={item.id}
                className={selected === item.id ? "row-selected" : ""}
              >
                <td>
                  <input
                    type="checkbox"
                    checked={selected === item.id}
                    onChange={() =>
                      setSelected(selected === item.id ? null : item.id)
                    }
                  />
                </td>
                <td className="date-cell">{dateText(item.date)}</td>
                <td>
                  <div className="vendor-cell">
                    <span className="vendor-avatar">
                      {item.vendor.charAt(0)}
                    </span>
                    <span>
                      <strong>{item.vendor}</strong>
                      <small>{item.planType}</small>
                    </span>
                  </div>
                </td>
                <td>
                  <span className="meal-tag">{item.mealSlot}</span>
                </td>
                <td>{item.pax}</td>
                <td>
                  <span
                    className={`status ${item.paymentStatus === "Paid" ? "paid" : "pending"}`}
                  >
                    {item.paymentStatus}
                  </span>
                </td>
                <td>
                  <span className="rating">
                    {"★".repeat(item.qualityRating)}
                    <em>{"★".repeat(5 - item.qualityRating)}</em>
                  </span>
                </td>
                <td className="right total-cell">{money(netTotal(item))}</td>
                <td>
                  <div className="row-actions">
                    <button title="Edit" onClick={() => onEdit(item)}>
                      <Pencil size={14} />
                    </button>
                    <button
                      title="Mark deposit returned"
                      disabled={!item.packagingDeposit || item.depositReturned}
                      onClick={() => onReturn(item)}
                    >
                      <Check size={14} />
                    </button>
                    <button title="Delete" onClick={() => onDelete(item.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && (
          <div className="empty-state">
            <Receipt size={25} />
            <strong>No matching transactions</strong>
            <span>Adjust your filters or add a new entry.</span>
          </div>
        )}
      </div>
    </section>
  );
}
function ReportsView({
  filtered,
  range,
  setRange,
  customStart,
  customEnd,
  setCustomStart,
  setCustomEnd,
  spend,
  exportPdf,
  exportExcel,
}: {
  filtered: FullTransaction[];
  range: Range;
  setRange: (value: Range) => void;
  customStart: string;
  customEnd: string;
  setCustomStart: (value: string) => void;
  setCustomEnd: (value: string) => void;
  spend: number;
  exportPdf: () => void;
  exportExcel: () => Promise<void>;
}) {
  return (
    <section className="report-view">
      <article className="report-hero">
        <div>
          <p className="eyebrow">REPORT BUILDER</p>
          <h2>A clean snapshot of your catering spend.</h2>
          <p>
            Choose a period, review the numbers, then export a report that is
            ready to share.
          </p>
        </div>
        <div className="report-actions">
          <button className="primary-button" onClick={exportPdf}>
            <Download size={16} />
            Export PDF
          </button>
          <button
            className="secondary-button"
            onClick={() => void exportExcel()}
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>
        </div>
      </article>
      <article className="panel report-controls">
        <div>
          <p className="eyebrow">REPORT PERIOD</p>
          <div className="report-pills">
            {(["This month", "Last month", "Custom"] as Range[]).map((item) => (
              <button
                className={range === item ? "selected" : ""}
                onClick={() => setRange(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        {range === "Custom" && (
          <div className="date-inputs large">
            <label>
              From
              <input
                type="date"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        )}
        <div className="report-total">
          <span>Filtered total</span>
          <strong>{money(spend)}</strong>
          <small>{filtered.length} rows included in export</small>
        </div>
      </article>
      <article className="panel report-preview">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">EXPORT PREVIEW</p>
            <h2>What will be included</h2>
          </div>
          <Check size={18} />
        </div>
        <div className="preview-grid">
          <span>
            <strong>01</strong>
            <small>Executive KPI strip</small>
          </span>
          <span>
            <strong>02</strong>
            <small>Full transaction log</small>
          </span>
          <span>
            <strong>03</strong>
            <small>Budget and totals</small>
          </span>
          <span>
            <strong>04</strong>
            <small>Vendor performance</small>
          </span>
        </div>
      </article>
    </section>
  );
}
function ProfileView({
  displayName,
  username,
  avatarUrl,
  setDisplayName,
  setUsername,
  setAvatarUrl,
  onSave,
}: {
  displayName: string;
  username: string;
  avatarUrl: string;
  setDisplayName: (value: string) => void;
  setUsername: (value: string) => void;
  setAvatarUrl: (value: string) => void;
  onSave: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="profile-view">
      <article className="profile-hero">
        <div className="large-avatar">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            displayName.slice(0, 2).toUpperCase()
          )}
        </div>
        <div>
          <p className="eyebrow">YOUR IDENTITY</p>
          <h2>{displayName}</h2>
          <p>@{username}</p>
        </div>
      </article>
      <form className="panel profile-form" onSubmit={onSave}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">PUBLIC PROFILE</p>
            <h2>How your workspace identifies you</h2>
          </div>
          <UserRound size={18} />
        </div>
        <label>
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="your.username"
          />
        </label>
        <label>
          Avatar URL
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <button className="primary-button" type="submit">
          Save profile
        </button>
      </form>
    </section>
  );
}
function ProfileModal({
  displayName,
  username,
  avatarUrl,
  budgetCap = 2500000,
  setDisplayName,
  setUsername,
  setAvatarUrl,
  onSubmit,
  onClose,
}: {
  displayName: string;
  username: string;
  avatarUrl: string;
  budgetCap?: number;
  setDisplayName: (value: string) => void;
  setUsername: (value: string) => void;
  setAvatarUrl: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop">
      <form className="entry-modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">WORKSPACE SETTINGS</p>
            <h2>Profile identity</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <label>
          Display name
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          Username
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          Avatar URL
          <input
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
          />
        </label>
        <label>
          Monthly budget cap (IDR)
          <input
            name="budgetCap"
            type="number"
            min="0"
            step="1000"
            defaultValue={budgetCap}
          />
        </label>
        <button className="primary-button modal-submit" type="submit">
          Save profile &amp; budget
        </button>
      </form>
    </div>
  );
}
function EntryModal({
  form,
  setForm,
  selected,
  onSubmit,
  onClose,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  selected: string | null;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  return (
    <div className="modal-backdrop">
      <form className="entry-modal wide" onSubmit={onSubmit}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{selected ? "EDIT ENTRY" : "NEW ENTRY"}</p>
            <h2>
              {selected ? "Update transaction" : "Add detailed transaction"}
            </h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <div className="form-grid">
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
          <label>
            Meal slot
            <select
              value={form.mealSlot}
              onChange={(event) => update("mealSlot", event.target.value)}
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
          </label>
          <label className="span-2">
            Vendor
            <input
              required
              value={form.vendor}
              onChange={(event) => update("vendor", event.target.value)}
              placeholder="Vendor name"
            />
          </label>
          <label>
            Plan type
            <input
              value={form.planType}
              onChange={(event) => update("planType", event.target.value)}
            />
          </label>
          <label>
            Pax
            <input
              type="number"
              min="1"
              value={form.pax}
              onChange={(event) =>
                update("pax", inputNumber(Number(event.target.value)))
              }
            />
          </label>
          <label>
            Base price / pax
            <input
              type="number"
              min="0"
              value={form.basePrice}
              onChange={(event) =>
                update("basePrice", inputNumber(Number(event.target.value)))
              }
            />
          </label>
          <label>
            Delivery fee
            <input
              type="number"
              min="0"
              value={form.deliveryFee}
              onChange={(event) =>
                update("deliveryFee", inputNumber(Number(event.target.value)))
              }
            />
          </label>
          <label>
            Packaging fee
            <input
              type="number"
              min="0"
              value={form.packagingFee}
              onChange={(event) =>
                update("packagingFee", inputNumber(Number(event.target.value)))
              }
            />
          </label>
          <label>
            Packaging deposit
            <input
              type="number"
              min="0"
              value={form.packagingDeposit}
              onChange={(event) =>
                update(
                  "packagingDeposit",
                  inputNumber(Number(event.target.value)),
                )
              }
            />
          </label>
          <label>
            Add-on items
            <input
              value={form.addonItems}
              onChange={(event) => update("addonItems", event.target.value)}
            />
          </label>
          <label>
            Add-on price
            <input
              type="number"
              min="0"
              value={form.addonPrice}
              onChange={(event) =>
                update("addonPrice", inputNumber(Number(event.target.value)))
              }
            />
          </label>
          <label>
            Discount
            <input
              type="number"
              min="0"
              value={form.discount}
              onChange={(event) =>
                update("discount", inputNumber(Number(event.target.value)))
              }
            />
          </label>
          <label>
            Payment status
            <select
              value={form.paymentStatus}
              onChange={(event) => update("paymentStatus", event.target.value)}
            >
              <option>Paid</option>
              <option>Unpaid / Payable</option>
              <option>Pending Reimbursement</option>
              <option>Deposit Deduction</option>
            </select>
          </label>
          <label>
            Payment method
            <select
              value={form.paymentMethod}
              onChange={(event) => update("paymentMethod", event.target.value)}
            >
              <option>Bank Transfer</option>
              <option>E-Wallet</option>
              <option>Prepaid Balance</option>
              <option>Cash</option>
            </select>
          </label>
          <label>
            Quality rating
            <select
              value={form.qualityRating}
              onChange={(event) =>
                update("qualityRating", Number(event.target.value))
              }
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Good</option>
              <option value="3">3 - Average</option>
              <option value="2">2 - Poor</option>
              <option value="1">1 - Bad</option>
            </select>
          </label>
          <label>
            On-time status
            <select
              value={form.onTimeStatus}
              onChange={(event) => update("onTimeStatus", event.target.value)}
            >
              <option>On-Time</option>
              <option>Delayed</option>
              <option>Missed</option>
            </select>
          </label>
          <label className="span-2">
            Menu notes
            <textarea
              value={form.menuNotes}
              onChange={(event) => update("menuNotes", event.target.value)}
              placeholder="Quality notes, issues, or context..."
            />
          </label>
        </div>
        <div className="form-total">
          <span>Net total preview</span>
          <strong>{money(netTotal(form))}</strong>
        </div>
        <button className="primary-button modal-submit" type="submit">
          {selected ? "Save changes" : "Create entry"}
        </button>
      </form>
    </div>
  );
}

export default App;
