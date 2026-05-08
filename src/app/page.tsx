"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";


type Member = {
  id: string;
  name: string;
  level: string;
  totalMatches: number;
};

type Attendance = {
  memberId: string;
  status: "present" | "off";
  matchesToday: number;
};

export default function Home() {
const [members, setMembers] = useState<Member[]>([]);
const [attendance, setAttendance] = useState<Attendance[]>([]);
const [name, setName] = useState("");
const [level, setLevel] = useState("Beginner");

useEffect(() => {
  fetchMembers();
}, []);

async function fetchMembers() {
  const { data } = await supabase
    .from("members")
    .select("*");

  if (data) {
    setMembers(
      data.map((member) => ({
        id: member.id,
        name: member.name,
        level: member.level,
        totalMatches: member.total_matches ?? 0,
      }))
    );
  }
}

 async function addMember() {
  if (!name) return;

  const { data, error } = await supabase
    .from("members")
    .insert([
      {
        name,
        level,
      },
    ])
    .select();

  console.log(data);
  console.log(error);

  fetchMembers();

  setName("");
  setLevel("Beginner");
}


  const deleteMember = (id: string) => {
    setMembers(members.filter((member) => member.id !== id));
    setAttendance(attendance.filter((item) => item.memberId !== id));
  };

  const markPresent = (memberId: string) => {
    const exists = attendance.find((item) => item.memberId === memberId);

    if (exists) {
      setAttendance(
        attendance.map((item) =>
          item.memberId === memberId
            ? { ...item, status: "present" }
            : item
        )
      );
    } else {
      setAttendance([
        ...attendance,
        {
          memberId,
          status: "present",
          matchesToday: 0,
        },
      ]);
    }
  };

  const markOff = (memberId: string) => {
    const exists = attendance.find((item) => item.memberId === memberId);

    if (exists) {
      setAttendance(
        attendance.map((item) =>
          item.memberId === memberId
            ? { ...item, status: "off", matchesToday: 0 }
            : item
        )
      );
    } else {
      setAttendance([
        ...attendance,
        {
          memberId,
          status: "off",
          matchesToday: 0,
        },
      ]);
    }
  };

  const addMatch = (memberId: string) => {
    setAttendance(
      attendance.map((item) =>
        item.memberId === memberId && item.status === "present"
          ? { ...item, matchesToday: item.matchesToday + 1 }
          : item
      )
    );

    setMembers(
      members.map((member) =>
        member.id === memberId
          ? { ...member, totalMatches: member.totalMatches + 1 }
          : member
      )
    );
  };

  const ranking = useMemo(() => {
    return [...members].sort((a, b) => b.totalMatches - a.totalMatches);
  }, [members]);

  const getAttendance = (memberId: string) => {
    return attendance.find((item) => item.memberId === memberId);
  };

  const getRankColor = (index: number) => {
    if (ranking.length <= 1) return "bg-green-100 text-green-700";

    const ratio = index / (ranking.length - 1);

    if (ratio <= 0.33) return "bg-green-100 text-green-700";
    if (ratio <= 0.66) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const presentCount = attendance.filter(
    (item) => item.status === "present"
  ).length;

  const offCount = members.length - presentCount;

  const todayMatches = attendance.reduce(
    (total, item) => total + item.matchesToday,
    0
  );

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">🏸 Badminton Manager</h1>

        <p className="mt-2 text-gray-600">
          Điểm danh, cộng trận và theo dõi lượt đánh realtime
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Tổng thành viên</p>
            <p className="mt-2 text-3xl font-bold">{members.length}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Có mặt hôm nay</p>
            <p className="mt-2 text-3xl font-bold">{presentCount}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Off hôm nay</p>
            <p className="mt-2 text-3xl font-bold">{offCount}</p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <p className="text-gray-500">Tổng trận hôm nay</p>
            <p className="mt-2 text-3xl font-bold">{todayMatches}</p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-white p-6 shadow">
          <h2 className="text-2xl font-bold">Thêm thành viên</h2>

          <div className="mt-6 flex flex-col gap-4 md:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên thành viên"
              className="flex-1 rounded-xl border p-4"
            />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="rounded-xl border p-4"
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <button
              onClick={addMember}
              className="rounded-xl bg-black px-6 py-4 text-white"
            >
              Thêm
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold">Attendance hôm nay</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {members.map((member) => {
                const record = getAttendance(member.id);
                const isPresent = record?.status === "present";

                return (
                  <div
                    key={member.id}
                    className="rounded-xl border p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-gray-500">
                          {member.level}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          {record?.matchesToday || 0} trận hôm nay
                        </p>

                        <p
                          className={`text-sm ${
                            isPresent ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {isPresent ? "Có mặt" : "Off"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => markPresent(member.id)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-white"
                      >
                        Có mặt
                      </button>

                      <button
                        onClick={() => markOff(member.id)}
                        className="rounded-lg bg-gray-300 px-4 py-2"
                      >
                        Off
                      </button>

                      <button
                        onClick={() => addMatch(member.id)}
                        disabled={!isPresent}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:bg-gray-300"
                      >
                        +1 trận
                      </button>

                      <button
                        onClick={() => deleteMember(member.id)}
                        className="rounded-lg bg-red-500 px-4 py-2 text-white"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="text-2xl font-bold">Biểu đồ lượt đấu</h2>

            <div className="mt-6 space-y-4">
              {ranking.map((member, index) => {
                const maxMatches = Math.max(
                  ...ranking.map((item) => item.totalMatches),
                  1
                );

                const width = (member.totalMatches / maxMatches) * 100;

                return (
                  <div key={member.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-semibold">
                        #{index + 1} {member.name}
                      </span>
                      <span>{member.totalMatches} trận</span>
                    </div>

                    <div className="h-8 rounded-full bg-gray-200">
                      <div
                        className={`h-8 rounded-full px-3 text-sm font-bold leading-8 ${getRankColor(
                          index
                        )}`}
                        style={{ width: `${Math.max(width, 8)}%` }}
                      >
                        {member.totalMatches}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}