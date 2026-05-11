"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import Timeline from "./timeline/Timeline";

type Member = {
  id: string;
  name: string;
  level: string;
  present: boolean;
  total_matches: number;
};
type UpcomingMatch = {
  id: string;
  players: Member[];
  status: string;
  created_at: string;
  match_type: string;
};

export default function Page() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Basic");
  const [selectedPlayers, setSelectedPlayers] = useState<Member[]>([]);
const [upcomingMatches, setUpcomingMatches] = useState<UpcomingMatch[]>([]);
const [matchType, setMatchType] = useState("Trận xếp");

  const fetchMembers = async () => {
    const { data } = await supabase
      .from("members")
      .select("*")
      .order("total_matches", { ascending: false });

    if (data) setMembers(data);
  };

  useEffect(() => {
    fetchMembers();
    fetchUpcomingMatches();
  }, []);

  const addMember = async () => {
    if (!name) return;

    await supabase.from("members").insert({
      name,
      level,
      present: false,
      total_matches: 0,
    });

    setName("");
    fetchMembers();
  };

 const setPresent = async (id: string, value: boolean) => {
  const { error } = await supabase
    .from("members")
    .update({ present: value })
    .eq("id", id);

 if (error) {
  console.error("FULL ERROR:", JSON.stringify(error, null, 2));
  alert(error.message);
  return;
}

  fetchMembers();
};

const addMatch = async (id: string) => {
  const member = members.find((m) => m.id === id);
  if (!member) return;

  const newTotal = member.total_matches + 1;

  const { error } = await supabase
    .from("members")
    .update({ total_matches: newTotal })
    .eq("id", id);

  if (error) {
  console.error("FULL ERROR:", JSON.stringify(error, null, 2));
  alert(error.message);
  return;
}

  await supabase.from("match_logs").insert({
    member_id: id,
    member_name: member.name,
    action: "+1 trận",
    matches_after: newTotal,
  });

  fetchMembers();
};

const removeMatch = async (id: string) => {
  const member = members.find((m) => m.id === id);
  if (!member) return;

  const newTotal = Math.max(0, member.total_matches - 1);

  const { error } = await supabase
    .from("members")
    .update({ total_matches: newTotal })
    .eq("id", id);

  if (error) {
  console.error("FULL ERROR:", JSON.stringify(error, null, 2));
  alert(error.message);
  return;
}
  await supabase.from("match_logs").insert({
    member_id: id,
    member_name: member.name,
    action: "-1 trận",
    matches_after: newTotal,
  });

  fetchMembers();
};

  const deleteMember = async (id: string) => {
    await supabase.from("members").delete().eq("id", id);
    fetchMembers();
  };

  const totalMembers = members.length;
  const presentToday = members.filter((m) => m.present).length;
  const offToday = totalMembers - presentToday;
  const totalMatches = members.reduce(
    (sum, m) => sum + m.total_matches,
    0
  );
const resetMatches = async () => {
  const { error } = await supabase
    .from("members")
    .update({ total_matches: 0 })
    .gte("total_matches", 0);

  if (error) {
    console.error("Reset matches error:", error);
    alert("Lỗi reset trận");
    return;
  }

  fetchMembers();
};
const toggleSelectPlayer = (member: Member) => {
  const exists = selectedPlayers.some((p) => p.id === member.id);

  if (exists) {
    setSelectedPlayers(selectedPlayers.filter((p) => p.id !== member.id));
    return;
  }

  if (selectedPlayers.length >= 4) {
    alert("Chỉ chọn tối đa 4 người cho 1 trận");
    return;
  }

  setSelectedPlayers([...selectedPlayers, member]);
};

const fetchUpcomingMatches = async () => {
  const { data, error } = await supabase
    .from("upcoming_matches")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Fetch upcoming matches error:", error);
    return;
  }

  setUpcomingMatches((data || []) as UpcomingMatch[]);
};

const createUpcomingMatch = async () => {
  if (selectedPlayers.length !== 4) {
    alert("Cần chọn đủ 4 người để ghép trận");
    return;
  }

  const { error: matchError } = await supabase
    .from("upcoming_matches")
    .insert({
      players: selectedPlayers,
      status: "upcoming",
      match_type: matchType,
    });

  if (matchError) {
    console.error(matchError);
    alert("Lỗi ghép trận");
    return;
  }

  for (const player of selectedPlayers) {
    const current = members.find((m) => m.id === player.id);

    await supabase
      .from("members")
      .update({
        total_matches: (current?.total_matches || 0) + 1,
      })
      .eq("id", player.id);
  }

  await supabase.from("match_logs").insert({
    member_id: selectedPlayers[0].id,

    member_name: selectedPlayers
      .map((p) => p.name.split(" ").slice(-2).join(" "))
      .join(" • "),

    action: `${matchType}`,
    matches_after: 0,
  });

  setSelectedPlayers([]);

  fetchMembers();
  fetchUpcomingMatches();
};

const deleteUpcomingMatch = async (id: string) => {
  await supabase.from("upcoming_matches").delete().eq("id", id);
  fetchUpcomingMatches();
};
  return (
  <div className="container">
    <div className="title">🏸 Badminton Manager</div>

    <div className="subtitle">
      Điểm danh, cộng trận và theo dõi lượt đánh realtime
    </div>

    <div className="page-layout">
      <div className="left-panel">
        <div className="grid-4">
          <div className="card">
            <div className="card-title">Tổng thành viên</div>
            <div className="card-number">{totalMembers}</div>
          </div>

          <div className="card">
            <div className="card-title">Có mặt hôm nay</div>
            <div className="card-number">{presentToday}</div>
          </div>

          <div className="card">
            <div className="card-title">Off hôm nay</div>
            <div className="card-number">{offToday}</div>
          </div>

          <div className="card">
            <div className="card-title">Tổng trận hôm nay</div>
            <div className="card-number">{totalMatches}</div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="section-title">Thêm thành viên</div>

          <div className="flex gap-4">
            <input
              className="flex-1"
              placeholder="Nhập tên thành viên"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option>Basic</option>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>

            <button className="black-btn" onClick={addMember}>
              Thêm
            </button>
          </div>
        </div>

        <div className="card match-compose-card">
          <div className="section-header">
            <div className="section-title">Trận đang xếp</div>

            <div className="match-compose-actions">
              <select
                className="match-type-select"
                value={matchType}
                onChange={(e) => setMatchType(e.target.value)}
              >
                <option>Trận xếp</option>
                <option>Trận order</option>
              </select>

              <button className="black-btn" onClick={createUpcomingMatch}>
                Ghép trận
              </button>
            </div>
          </div>

          <div className="selected-row">
            {selectedPlayers.length === 0 ? (
              <div className="empty-text">Chưa chọn thành viên</div>
            ) : (
              selectedPlayers.map((player, index) => (
                <div key={player.id} className="selected-pill">
                  {index + 1}. {player.name}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="main-grid">
          <div className="card">
            <div className="section-header">
              <div className="section-title">Attendance hôm nay</div>

              <button className="reset-btn" onClick={resetMatches}>
                <span className="reset-icon">↻</span>
                Reset
              </button>
            </div>

            <div className="attendance-scroll">
              {["Intermediate", "Basic", "Advanced"].map((group) => (
                <div key={group} className="attendance-group">
                  <div className="attendance-group-title">{group}</div>

                  {[...members]
                    .filter((member) => member.level === group)
                    .sort((a, b) => {
                      if (a.present !== b.present) {
                        return Number(b.present) - Number(a.present);
                      }

                      return a.total_matches - b.total_matches;
                    })
                    .map((member) => (
                      <div
                        key={member.id}
                        className={`member-card ${
                          member.present ? "member-active" : ""
                        }`}
                      >
                        <div className="member-left">
                          <div className="member-name">{member.name}</div>
                          <div className="level">{member.level}</div>
                          <div className="member-status">
                            {member.present ? "Present" : "Off"}
                          </div>
                          <div className="member-matches">
                            {member.total_matches} trận
                          </div>
                        </div>

                        <div className="member-actions">
                          <button
                            className={
                              selectedPlayers.some((p) => p.id === member.id)
                                ? "yellow-btn"
                                : member.present
                                ? "yellow-soft-btn"
                                : "match-btn"
                            }
                            onClick={() => toggleSelectPlayer(member)}
                          >
                            Chọn
                          </button>

                          <button
                            className="green-btn"
                            onClick={() => setPresent(member.id, true)}
                          >
                            Có mặt
                          </button>

                          <button
                            className="gray-btn"
                            onClick={() => setPresent(member.id, false)}
                          >
                            Off
                          </button>

                          <button
                            className={member.present ? "blue-btn" : "match-btn"}
                            onClick={() => addMatch(member.id)}
                          >
                            +1 trận
                          </button>

                          <button
                            className={
                              member.present ? "orange-btn" : "match-btn"
                            }
                            onClick={() => removeMatch(member.id)}
                          >
                            -1 trận
                          </button>

                          <button
                            className="red-btn"
                            onClick={() => deleteMember(member.id)}
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title">Biểu đồ lượt đấu</div>

            {[...members]
              .filter((member) => member.present)
              .sort((a, b) => a.total_matches - b.total_matches)
              .map((member, index) => (
                <div key={member.id} className="mb-4">
                  <div
                    className="flex"
                    style={{ justifyContent: "space-between" }}
                  >
                    <div>
                      #{index + 1} {member.name}
                    </div>

                    <div>
                      <strong>{member.total_matches}</strong> trận
                    </div>
                  </div>

                  <div className="bar-bg mt-2">
                    <div
                      className={`bar-fill ${
                        member.total_matches <= 2
                          ? "low"
                          : member.total_matches <= 5
                          ? "mid"
                          : "high"
                      }`}
                      style={{
                        width: `${member.total_matches * 10}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card mt-4">
          <div className="section-title">Timeline hoạt động</div>
          <Timeline />
        </div>
      </div>

      <div className="right-panel">
        <div className="card upcoming-card">
          <div className="section-title">Upcoming Match</div>

          {upcomingMatches.map((match, index) => (
            <div
              key={match.id}
              className={`match-order-card ${
                match.match_type === "Trận order"
                  ? "match-order-purple"
                  : "match-order-yellow"
              }`}
            >
              <div className="match-order-title">Match #{index + 1}</div>

              <div className="match-type-tag">{match.match_type}</div>

              {match.players.map((player, i) => (
                <div key={player.id}>
                  {i + 1}. {player.name}
                </div>
              ))}

              <button
                className="red-btn mt-2"
                onClick={() => deleteUpcomingMatch(match.id)}
              >
                Xóa trận
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
}