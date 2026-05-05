import { useState, useEffect } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { connectSocket } from "@/lib/socket";
import MapView from "@/components/MapView";
import BottomNav from "@/components/BottomNav";
import { Package, CheckCircle, Clock, Truck, ShoppingBag } from "lucide-react";

const DEFAULT_LAT = 24.540340;
const DEFAULT_LNG = 92.588568;

const STATUS_STEPS = [
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "on_the_way", label: "On the way", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
];

function getStepIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

interface OrderItem {
  id: number;
  shopId: number;
  riderId: number | null;
  status: "preparing" | "on_the_way" | "delivered";
  customerLat: number;
  customerLng: number;
  shopName: string;
  riderName: string | null;
  createdAt: string;
}

interface RiderPos {
  lat: number;
  lng: number;
}

export default function Orders() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading } = useListOrders();
  const updateStatus = useUpdateOrderStatus({ mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() }) } });
  const [riderPositions, setRiderPositions] = useState<Record<number, RiderPos>>({});
  const [orderStatuses, setOrderStatuses] = useState<Record<number, string>>({});

  const activeOrders = (orders as OrderItem[]).filter((o) => o.status !== "delivered");
  const pastOrders = (orders as OrderItem[]).filter((o) => o.status === "delivered");

  useEffect(() => {
    if (!token || !activeOrders.length) return;
    const socket = connectSocket(token);

    activeOrders.forEach((order) => {
      socket.emit("join-order", order.id);
    });

    socket.on("rider-location", (data: { lat: number; lng: number; orderId: number }) => {
      setRiderPositions((prev) => ({ ...prev, [data.orderId]: { lat: data.lat, lng: data.lng } }));
    });

    socket.on("order-update", (data: { status: string; orderId: number }) => {
      setOrderStatuses((prev) => ({ ...prev, [data.orderId]: data.status }));
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
    });

    return () => {
      socket.off("rider-location");
      socket.off("order-update");
    };
  }, [token, activeOrders.length]);

  const getEffectiveStatus = (order: OrderItem) => orderStatuses[order.id] || order.status;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-[#e53935] px-4 pt-12 pb-5">
        <h1 className="text-white text-xl font-black tracking-tight">NEXAMOVE</h1>
        <p className="text-red-100 text-sm mt-1 font-medium">Your Orders</p>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {isLoading && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-3 border-[#e53935] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="bg-white rounded-2xl px-4 py-12 text-center shadow-sm border border-gray-100">
            <ShoppingBag size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No orders yet</p>
            <p className="text-gray-400 text-sm mt-1">Order something from nearby shops</p>
          </div>
        )}

        {/* Active orders */}
        {activeOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Active Orders</h2>
            {activeOrders.map((order) => {
              const status = getEffectiveStatus(order);
              const stepIdx = getStepIndex(status);
              const riderPos = riderPositions[order.id];

              return (
                <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3" data-testid={`order-card-${order.id}`}>
                  <div className="px-4 pt-4 pb-3 border-b border-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{order.shopName}</p>
                        <p className="text-gray-400 text-xs mt-0.5">Order #{order.id}</p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        status === "preparing" ? "bg-amber-50 text-amber-600" :
                        status === "on_the_way" ? "bg-blue-50 text-blue-600" :
                        "bg-green-50 text-green-600"
                      }`} data-testid={`status-order-${order.id}`}>
                        {STATUS_STEPS.find((s) => s.key === status)?.label || status}
                      </span>
                    </div>
                    {order.riderName && (
                      <p className="text-xs text-gray-500 mt-1.5">Rider: <span className="font-semibold text-gray-700">{order.riderName}</span></p>
                    )}
                  </div>

                  {/* Status stepper */}
                  <div className="px-4 py-3">
                    <div className="flex items-center">
                      {STATUS_STEPS.map((step, idx) => {
                        const done = idx <= stepIdx;
                        const StepIcon = step.icon;
                        return (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                              done ? "bg-[#e53935]" : "bg-gray-100"
                            }`}>
                              <StepIcon size={13} className={done ? "text-white" : "text-gray-400"} />
                            </div>
                            {idx < STATUS_STEPS.length - 1 && (
                              <div className={`flex-1 h-0.5 mx-1 ${idx < stepIdx ? "bg-[#e53935]" : "bg-gray-100"}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between mt-1.5 px-0">
                      {STATUS_STEPS.map((step, idx) => (
                        <span key={step.key} className={`text-[9px] font-medium ${idx <= stepIdx ? "text-[#e53935]" : "text-gray-400"}`}>
                          {step.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Live map for active orders */}
                  {(status === "on_the_way" || riderPos) && (
                    <div className="px-3 pb-3">
                      <MapView
                        centerLat={order.customerLat || DEFAULT_LAT}
                        centerLng={order.customerLng || DEFAULT_LNG}
                        riderLat={riderPos?.lat}
                        riderLng={riderPos?.lng}
                        height="180px"
                      />
                      {riderPos && (
                        <p className="text-xs text-gray-500 text-center mt-1.5">
                          Live rider tracking active
                        </p>
                      )}
                    </div>
                  )}

                  {/* Rider can update status */}
                  {user?.role === "rider" && status !== "delivered" && (
                    <div className="px-4 pb-4 pt-1">
                      <button
                        data-testid={`button-update-status-${order.id}`}
                        onClick={() => {
                          const nextStatus = status === "preparing" ? "on_the_way" : "delivered";
                          updateStatus.mutate({ id: order.id, data: { status: nextStatus } });
                        }}
                        className="w-full bg-[#e53935] text-white rounded-xl py-2.5 text-sm font-bold hover:bg-[#c62828] transition-colors"
                      >
                        Mark as {status === "preparing" ? "On the Way" : "Delivered"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Past orders */}
        {pastOrders.length > 0 && (
          <div>
            <h2 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Past Orders</h2>
            {pastOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 mb-2 flex items-center gap-3" data-testid={`order-history-${order.id}`}>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                  <CheckCircle size={18} className="text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{order.shopName}</p>
                  <p className="text-gray-400 text-xs">Order #{order.id} · Delivered</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
