'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [auth, setAuth] = useState(false);
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [cars, setCars] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    set_number: '',
    name: '',
    brand: 'Ferrari',
    pieces: '',
    price: '',
  });

  useEffect(() => {
    if (auth) loadData();
  }, [auth]);

  async function loadData() {
    const { data: carData } = await supabase.from('cars').select('*').order('id', { ascending: false });
    const { data: orderData } = await supabase.from('orders').select('*').order('id', { ascending: false });
    if (carData) setCars(carData);
    if (orderData) setOrders(orderData);
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (pass === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      setAuth(true);
    } else {
      alert('Sai mật khẩu!');
    }
  }

  async function handleAddCar(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return alert('Vui lòng chọn ảnh xe LEGO!');
    setLoading(true);

    const fileName = Date.now() + '-' + file.name.replace(/\s+/g, '-');
    const { error: uploadError } = await supabase.storage.from('lego-images').upload(fileName, file);

    if (uploadError) {
      setLoading(false);
      return alert('Lỗi tải ảnh: ' + uploadError.message);
    }

    const { data: urlData } = supabase.storage.from('lego-images').getPublicUrl(fileName);

    const { error: insertError } = await supabase.from('cars').insert([
      {
        set_number: form.set_number,
        name: form.name,
        brand: form.brand,
        pieces: Number(form.pieces),
        price: Number(form.price),
        image_url: urlData.publicUrl,
      },
    ]);

    setLoading(false);
    if (!insertError) {
      alert('Đăng xe thành công!');
      setForm({ set_number: '', name: '', brand: 'Ferrari', pieces: '', price: '' });
      setFile(null);
      loadData();
    } else {
      alert('Lỗi lưu dữ liệu: ' + insertError.message);
    }
  }
  async function handleDeleteCar(id: number) {
    if (!confirm('Xóa mẫu xe này?')) return;
    await supabase.from('cars').delete().eq('id', id);
    loadData();
  }

  if (!auth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-6 rounded-xl shadow w-80 space-y-4">
          <h1 className="font-bold text-lg text-center">Đăng nhập Quản trị Shop</h1>
          <input
            type="password"
            placeholder="Nhập mật khẩu Admin"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            className="w-full border p-2 rounded"
          />
          <button className="w-full bg-red-600 text-white py-2 rounded font-bold">Vào trang quản trị</button>
        </form>
      </div>
    );
  }
async function handleDeleteOrder(id: number) {
  if (!confirm('Xóa đơn hàng này?')) return;
  await supabase.from('orders').delete().eq('id', id);
  loadData();
}
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản trị LEGO Auto Shop</h1>
        <a href="/" className="text-red-600 underline font-semibold">← Về trang bán hàng</a>
      </div>

      <form onSubmit={handleAddCar} className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="font-bold text-lg">1. Đăng bán mẫu LEGO xe mới</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            required
            placeholder="Mã Set LEGO (VD: 42143)"
            value={form.set_number}
            onChange={(e) => setForm({ ...form, set_number: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            required
            placeholder="Tên xe (VD: Ferrari Daytona SP3)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            required
            placeholder="Hãng xe (VD: Ferrari, Porsche, F1...)"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            required
            type="number"
            placeholder="Số mảnh ghép (VD: 3778)"
            value={form.pieces}
            onChange={(e) => setForm({ ...form, pieces: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            required
            type="number"
            placeholder="Giá bán VNĐ (VD: 1250000)"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.item(0) || null)}
            className="border p-1.5 rounded"
          />
        </div>
        <button
          disabled={loading}
          className="bg-black text-white px-6 py-2.5 rounded-lg font-bold hover:bg-gray-800"
        >
          {loading ? 'Đang tải ảnh & lưu...' : '+ Đăng bán ngay'}
        </button>
      </form>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-4">2. Đơn hàng khách đã đặt ({orders.length})</h2>
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border p-4 rounded-lg text-sm space-y-1">
              <div className="flex justify-between font-bold">
                <span>#{o.id} - {o.customer_name} ({o.phone})</span>
                <span className="text-red-600">{o.total_price.toLocaleString('vi-VN')}đ</span>
              </div>
              <p className="text-gray-600">Địa chỉ: {o.address}</p>
              <p className="text-gray-800">
                Sản phẩm: {o.items.map((i: any) => i.name + ' (x' + i.quantity + ')').join(', ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg mb-4">3. Danh sách xe đang bán ({cars.length})</h2>
        <div className="space-y-2">
          {cars.map((c) => (
            <div key={c.id} className="flex justify-between items-center border-b py-2 text-sm">
              <span><b>#{c.set_number}</b> - {c.name} ({c.price.toLocaleString('vi-VN')}đ)</span>
<button onClick={() => handleDeleteCar(c.id)} className="text-red-600 font-semibold">Xóa</button>            </div>
          ))}
        </div>
      </div>
    </div>
  );
}