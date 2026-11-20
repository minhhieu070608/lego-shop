'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ShoppingCart, Car, Trash2, CheckCircle, Search } from 'lucide-react';

interface CarProduct {
  id: number;
  set_number: string;
  name: string;
  brand: string;
  pieces: number;
  price: number;
  image_url: string;
}

interface CartItem extends CarProduct {
  quantity: number;
}

export default function HomePage() {
  const [cars, setCars] = useState<CarProduct[]>([]);
  const [filterBrand, setFilterBrand] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '' });
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    fetchCars();
    const savedCart = localStorage.getItem('lego_cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  async function fetchCars() {
    const { data } = await supabase.from('cars').select('*').order('id', { ascending: false });
    if (data) setCars(data);
  }

  function addToCart(car: CarProduct) {
    const existing = cart.find((item) => item.id === car.id);
    const updated = existing
      ? cart.map((item) => (item.id === car.id ? { ...item, quantity: item.quantity + 1 } : item))
      : [...cart, { ...car, quantity: 1 }];
    setCart(updated);
    localStorage.setItem('lego_cart', JSON.stringify(updated));
  }

  function removeFromCart(id: number) {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem('lego_cart', JSON.stringify(updated));
  }

  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    const { error } = await supabase.from('orders').insert([
      {
        customer_name: customer.name,
        phone: customer.phone,
        address: customer.address,
        items: cart,
        total_price: totalPrice,
      },
    ]);

    if (!error) {
      setOrderSuccess(true);
      setCart([]);
      localStorage.removeItem('lego_cart');
    } else {
      alert('Lỗi đặt hàng: ' + error.message);
    }
  }

  const brands = ['Tất cả', ...Array.from(new Set(cars.map((c) => c.brand)))];
  const filteredCars = cars.filter((c) => {
    const matchBrand = filterBrand === 'Tất cả' || c.brand === filterBrand;
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.set_number.toLowerCase().includes(search.toLowerCase());
    return matchBrand && matchSearch;
  });

  const qrUrl = '/qr.jpg';

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-red-600 text-white sticky top-0 z-20 shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Car className="w-7 h-7" />
            <span>LEGO AUTO SHOP</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/admin" className="text-sm underline opacity-90 hover:opacity-100">
              Quản trị
            </a>
            <button
              onClick={() => {
                setShowCart(!showCart);
                setOrderSuccess(false);
              }}
              className="bg-yellow-400 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-yellow-300"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Giỏ hàng ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            {brands.map((b) => (
              <button
                key={b}
                onClick={() => setFilterBrand(b)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filterBrand === b ? 'bg-red-600 text-white' : 'bg-white text-gray-700 shadow-sm'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên xe hoặc mã set..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border bg-white w-full md:w-64"
            />
          </div>
        </div>

        {filteredCars.length === 0 ? (
          <div className="bg-white p-10 rounded-xl text-center text-gray-500">
            Chưa có mẫu xe nào. Hãy bấm chữ <b>Quản trị</b> ở góc trên bên phải để đăng xe đầu tiên!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredCars.map((car) => (
              <div key={car.id} className="bg-white rounded-xl shadow overflow-hidden flex flex-col">
                <img src={car.image_url} alt={car.name} className="w-full h-56 object-cover bg-gray-50" />
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span className="font-semibold text-red-600">{car.brand}</span>
                      <span>Set #{car.set_number} • {car.pieces} mảnh</span>
                    </div>
                    <h2 className="font-bold text-lg mb-2">{car.name}</h2>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-extrabold text-red-600">
                      {car.price.toLocaleString('vi-VN')}đ
                    </span>
                    <button
                      onClick={() => addToCart(car)}
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800"
                    >
                      + Thêm giỏ
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-30 flex justify-end">
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-xl font-bold">Giỏ hàng của bạn</h2>
                <button onClick={() => setShowCart(false)} className="text-gray-500 font-bold">
                  Đóng ✕
                </button>
              </div>

              {orderSuccess ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle className="w-14 h-14 text-green-600 mx-auto" />
                  <h3 className="text-xl font-bold text-green-700">Đặt hàng thành công!</h3>
                  <p className="text-sm text-gray-600">
                    Shop sẽ gọi điện xác nhận đơn hàng của bạn trong ít phút tới.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <p className="text-gray-500 text-center py-10">Giỏ hàng đang trống.</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {cart.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b pb-2">
                        <div>
                          <p className="font-semibold text-sm">{item.name}</p>
                          <p className="text-xs text-gray-500">
                            {item.price.toLocaleString('vi-VN')}đ x {item.quantity}
                          </p>
                        </div>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-lg font-bold flex justify-between mb-4">
                    <span>Tổng cộng:</span>
                    <span className="text-red-600">{totalPrice.toLocaleString('vi-VN')}đ</span>
                  </div>

                  <form onSubmit={handleCheckout} className="space-y-3">
                    <input
                      required
                      placeholder="Họ và tên người nhận"
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full border p-2.5 rounded-lg"
                    />
                    <input
                      required
                      placeholder="Số điện thoại"
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full border p-2.5 rounded-lg"
                    />
                    <textarea
                      required
                      placeholder="Địa chỉ nhận hàng chi tiết"
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full border p-2.5 rounded-lg"
                    />

                    <div className="bg-gray-50 p-3 rounded-lg border text-center">
                      <p className="text-xs text-gray-600 mb-2">
                        Thanh toán COD khi nhận hàng hoặc quét mã QR bên dưới để chuyển khoản trước:
                      </p>
                      <img src={qrUrl} alt="VietQR" className="w-44 mx-auto rounded" />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700"
                    >
                      XÁC NHẬN ĐẶT HÀNG
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}