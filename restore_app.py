with open("src/App.tsx", "r") as f:
    lines = f.readlines()

out = []
skip = False
for line in lines:
    if "const liveFarmer = far  // Self-healing database deduplication removed" in line:
        skip = True
        out.append("""        const liveFarmer = farmers.find(
          (f) => f && (f.id === currentUser.data?.id || f.mobile === currentUser.data?.mobile),
        );
        if (
          liveFarmer &&
          JSON.stringify(liveFarmer) !== JSON.stringify(currentUser.data)
        ) {
          setCurrentUser((prev: any) => (prev ? { ...prev, data: liveFarmer } : null));
        }
      } else if (
        (currentUser.type === "user" || currentUser.type === "admin") &&
        (users || []).length > 0
      ) {
        const liveUser = users.find(
          (u) => u && (u.id === currentUser.data?.id || u.loginId === currentUser.data?.loginId),
        );
        if (
          liveUser &&
          JSON.stringify(liveUser) !== JSON.stringify(currentUser.data)
        ) {
          setCurrentUser((prev: any) => (prev ? { ...prev, data: liveUser } : null));
        }
      }
    } catch (err) {
      console.warn("User sync effect failed:", err);
    }
  }, [
    farmers,
    users,
    currentUser?.type,
    currentUser?.data?.id,
    currentUser?.data?.mobile,
    currentUser?.data?.loginId,
  ]);
""")
    if skip and "}, [products]);" in line:
        skip = False
        continue
    if not skip:
        out.append(line)

with open("src/App.tsx", "w") as f:
    f.writelines(out)
