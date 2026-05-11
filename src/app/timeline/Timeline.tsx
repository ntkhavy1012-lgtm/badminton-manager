"use client"; // bắt buộc để component chạy trên client

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";

export type MatchLog = {
  id: string;
  member_id: string;
  member_name: string;
  action: string;
  matches_after: number;
  created_at: string;
};

export default function Timeline() {
  const [logs, setLogs] = useState<MatchLog[] | null>(null); // null để check loading

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("match_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    console.log("Supabase fetch raw:", { data, error }); // debug
    if (error) {
  console.error("Supabase fetch error full:", JSON.stringify(error, null, 2));
}
    if (data) setLogs(data as MatchLog[]);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (logs === null) {
    return <div>Đang tải dữ liệu...</div>; // skeleton loading
  }

  if (logs.length === 0) {
    return <div>Chưa có dữ liệu trận đấu</div>;
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full table-auto border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th>Thời gian</th>
            <th>Thành viên</th>
            <th>Hành động</th>
            <th>Tổng trận</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{new Date(log.created_at).toLocaleString()}</td>
              <td>{log.member_name}</td>
              <td>{log.action}</td>
              <td>{log.matches_after}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
