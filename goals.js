// Firebase already loaded from compat scripts
const auth = firebase.auth();
const db = firebase.firestore();

let globalUid = null; // We'll store the uid here

// Check login
auth.onAuthStateChanged(user => {
  if (!user) {
    alert("Please log in first!");
    location.href = "index.html";
    return;
  }
  globalUid = user.uid; // Set the global uid
  loadGoals();
});

// Add new goal
document.getElementById("addGoalBtn").addEventListener("click", async () => {
  const text = document.getElementById("goalInput").value.trim();
  if (!text) return alert("Goal cannot be empty!");

  if (!globalUid) {
    return alert("Error: User ID not found. Please refresh.");
  }

  try {
    await db.collection("users").doc(globalUid).collection("goals").add({
      text,
      completed: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    document.getElementById("goalInput").value = "";
    loadGoals(); // Reload after adding
  } catch (e) {
    console.error("Error adding goal: ", e);
    alert("Could not add goal. Check console (F12) for errors.");
  }
});

// Load all goals
async function loadGoals() {
  const list = document.getElementById("goalList");
  list.innerHTML = "Loading...";

  if (!globalUid) {
    list.innerHTML = "<p class='danger'>Error: Not logged in.</p>";
    return;
  }

  try {
    const snap = await db.collection("users")
                         .doc(globalUid)
                         .collection("goals")
                         .get();

    list.innerHTML = ""; // Clear "Loading..."

    const goals = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    goals.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));

    goals.forEach(goal => {
      const card = document.createElement("div");
      card.className = "entry-card goal-card"; 
      if (goal.completed) {
        card.classList.add('completed-goal'); 
      }

      card.innerHTML = `
        <div class="goal-content">
          <input 
            type="checkbox" 
            class="goal-checkbox" 
            data-id="${goal.id}" 
            ${goal.completed ? 'checked' : ''}
          >
          <span class="entry-title">${goal.text}</span>
        </div>
        <div class="entry-actions">
          <button class="delete danger" data-id="${goal.id}">Delete</button>
        </div>
      `;
      list.appendChild(card);
    });

    // --- ADD EVENT LISTENERS AFTER RENDERING ---
    list.querySelectorAll('.delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        if (confirm("Delete this goal?")) {
          await db.collection("users").doc(globalUid).collection("goals").doc(id).delete();
          loadGoals(); 
        }
      });
    });

    list.querySelectorAll('.goal-checkbox').forEach(box => {
      box.addEventListener('click', async (e) => {
        const id = e.target.dataset.id;
        const isChecked = e.target.checked;
        try {
          await db.collection("users").doc(globalUid).collection("goals").doc(id).update({
            completed: isChecked
          });
          e.target.closest('.goal-card').classList.toggle('completed-goal', isChecked);
        } catch (err) {
          console.error("Error updating goal: ", err);
          alert("Could not update goal status.");
        }
      });
    });

    if (snap.empty) {
      list.innerHTML = `<p class="muted">No goals yet! Add your first one 🚀</p>`;
    }
  } catch (e) {
    console.error("Error loading goals: ", e);
    list.innerHTML = `<p class="danger">Error loading goals. Check console (F12).</p>`;
  }
}