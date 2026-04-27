window.onerror = function(message, source, lineno, colno, error) {
    console.error("Global JS Error:", message, "at", source + ":" + lineno + ":" + colno, error);
};

// --- Supabase Initialization ---
const SUPABASE_URL = 'https://civvowhbgrfpqjjqrhtc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdnZvd2hiZ3JmcHFqanFyaHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNTY3NjgsImV4cCI6MjA2MDkzMjc2OH0.6C97_91D15weTB0Sv3WGDllMJlRw3fBdGp6MeiantZw';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("Supabase client initialized:", supabase);

document.addEventListener('DOMContentLoaded', async () => { // Make the listener async
    console.log("SCRIPT LOADED");

    // --- Global Data Arrays (will be populated from Supabase) ---
    let todos = [];
    let templates = [];
    let goals = [];

    // --- Feature Toggles ---
    const kanbanContainer = document.getElementById('kanban-container');
    const calendarContainer = document.getElementById('calendar-container');
    const templatesContainer = document.getElementById('templates-container');
    const goalsContainer = document.getElementById('goals-container');
    const aiFeatures = document.getElementById('ai-features');
    const todoList = document.getElementById('todoList');
    const editorContainer = document.getElementById('editor-container');

    // Diagnostic log for main elements
    console.log({ kanbanContainer, calendarContainer, templatesContainer, goalsContainer, aiFeatures, todoList, editorContainer });

    // --- View Mode State ---
    let currentView = 'list'; // list | kanban | calendar | templates | goals

    // --- Quill Rich Text Editor ---
    let quill;
    let currentEditingTaskId = null;
    
    function initQuill(content = '') {
        editorContainer.style.display = 'block';
        if (!quill) {
            quill = new Quill('#quill-editor', {
                theme: 'snow',
                placeholder: 'Enter task details or notes...',
                modules: {
                    toolbar: [
                        ['bold', 'italic', 'underline', 'strike'],
                        ['blockquote', 'code-block'],
                        [{ 'header': 1 }, { 'header': 2 }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        ['link', 'image'],
                        ['clean']
                    ]
                }
            });
        }
        quill.root.innerHTML = content;
    }
    
    function hideQuill() {
        // Clean up any existing editor title before hiding
        const existingTitle = editorContainer.querySelector('.editor-title');
        if (existingTitle) {
            existingTitle.remove();
        }
        editorContainer.style.display = 'none';
        currentEditingTaskId = null;
    }
    
    // Save rich text content to task
    // Save rich text content to task in Supabase
    async function saveTaskDetails() { // Make async
        if (currentEditingTaskId) {
            // Get the current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                alert('Please sign in to save task details.');
                return;
            }

            const taskDetails = quill.root.innerHTML;

            // Update in Supabase, filtering by both task ID and user ID
            const { data, error } = await supabase
                .from('tasks')
                .update({ details: taskDetails })
                .eq('id', currentEditingTaskId) // Match by ID
                .eq('user_id', user.id); // Match by user ID

            if (error) {
                console.error('Error saving task details:', error);
                alert('Error saving task details. Please check the console.');
                // Optionally, handle reverting the Quill editor content
                return; // Stop if update failed
            }

            console.log("Task details saved successfully:", data);

            // Update local array after successful DB update
            const taskIndex = todos.findIndex(t => t.id === currentEditingTaskId);
            if (taskIndex !== -1) {
                todos[taskIndex].details = taskDetails;
            }

            renderTodoList(); // Refresh the list to show/hide details indicators
            hideQuill(); // Hide the editor
        }
    }
    
    // Setup editor buttons
    document.getElementById('save-details').addEventListener('click', saveTaskDetails);
    document.getElementById('cancel-edit').addEventListener('click', hideQuill);

    // --- FullCalendar ---
    let calendar;
    function initCalendar(tasks) {
        calendarContainer.style.display = 'block';
        if (!calendar) {
            calendar = new FullCalendar.Calendar(calendarContainer, {
                initialView: 'dayGridMonth',
                events: tasks.filter(t => t.dueDate).map(t => ({
                    id: t.id,
                    title: t.text,
                    start: t.dueDate,
                    color: t.completed ? '#e0e7ef' : '#62b6cb'
                })),
                eventClick: function(info) {
                    // Show task details on event click
                    showTaskDetails(info.event.id);
                }
            });
            calendar.render();
        } else {
            calendar.removeAllEvents();
            tasks.filter(t => t.dueDate).forEach(t => {
                calendar.addEvent({
                    id: t.id,
                    title: t.text,
                    start: t.dueDate,
                    color: t.completed ? '#e0e7ef' : '#62b6cb'
                });
            });
        }
    }
    function hideCalendar() {
        calendarContainer.style.display = 'none';
    }

    // --- Kanban Board ---
    function renderKanban(tasks) {
        kanbanContainer.style.display = 'block';
        const kanbanBoardWrapper = document.getElementById('kanban-board-wrapper');
        kanbanBoardWrapper.innerHTML = ''; // Clear existing board content

        const columns = ['To Do', 'In Progress', 'Done'];
        const statusMap = { 'To Do': 'todo', 'In Progress': 'inprogress', 'Done': 'done' };
        const colEls = {};

        columns.forEach(col => {
            const colStatus = statusMap[col];
            const colDiv = document.createElement('div');
            colDiv.className = 'kanban-column';
            colDiv.dataset.status = colStatus; // Store status on the column
            colDiv.innerHTML = `
                <h3>${col}</h3>
                <div class="kanban-cards"></div>
                <div class="add-task-kanban">
                    <input type="text" class="add-task-input" placeholder="Add task to ${col}...">
                    <button class="add-task-button">Add</button>
                </div>
            `;
            colEls[colStatus] = colDiv;
            kanbanBoardWrapper.appendChild(colDiv);

            // Add event listener for adding task directly to column
            colDiv.querySelector('.add-task-button').addEventListener('click', () => {
                const input = colDiv.querySelector('.add-task-input');
                const taskText = input.value.trim();
                if (taskText) {
                    addTaskToKanbanColumn(taskText, 'medium', '', colStatus); // Default priority/date for quick add
                    input.value = ''; // Clear input
                }
            });
        });

        tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = 'kanban-card';
            card.dataset.id = task.id; // Store task ID on the card
            card.innerHTML = `
                <span class="task-text">${task.text}</span>
                <div class="task-meta">
                    <span class="task-priority priority-${task.priority || 'medium'}">${(task.priority || 'medium').charAt(0).toUpperCase() + (task.priority || 'medium').slice(1)}</span>
                    <span class="task-due-date">${task.dueDate || 'No Due Date'}</span>
                </div>
            `;
            // Append card to the correct column's cards container
            const cardsContainer = colEls[task.status || 'todo'].querySelector('.kanban-cards');
            if (cardsContainer) {
                cardsContainer.appendChild(card);
            } else {
                console.error(`Kanban cards container not found for status: ${task.status || 'todo'}`);
            }
        });

        // Initialize SortableJS on each kanban-cards container
        columns.forEach(col => {
            const colStatus = statusMap[col];
            const cardsContainer = colEls[colStatus].querySelector('.kanban-cards');
            if (cardsContainer) {
                Sortable.create(cardsContainer, {
                    group: 'kanban', // items can be dragged between lists with the same group name
                    animation: 150,
                    onEnd: function (evt) {
                        const taskId = parseInt(evt.item.dataset.id);
                        const newStatus = evt.to.parentElement.dataset.status; // Get status from column div
                        updateTaskStatus(taskId, newStatus);
                    }
                });
            }
        });
    }

    function hideKanban() {
        kanbanContainer.style.display = 'none';
    }

    // Function to update task status
    function updateTaskStatus(taskId, newStatus) {
        const taskIndex = todos.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            todos[taskIndex].status = newStatus;
            saveTodos(); // Save changes
            // No need to re-render the whole board, SortableJS handles the DOM
        }
    }

    // Function to add task directly to a Kanban column
    function addTaskToKanbanColumn(text, priority, dueDate, status) {
        const newTodo = {
            id: Date.now(), // Simple unique ID
            text: text,
            completed: false,
            priority: priority,
            dueDate: dueDate,
            details: '',
            status: status, // Set initial status
            tags: [],
            subtasks: [],
            links: [],
            goalId: null // Add goalId property
        };
        todos.push(newTodo);
        saveTodos(); // Save changes
        renderKanban(todos); // Re-render the kanban board to show the new task
    }

    // --- Templates (Scaffold) ---
// --- Templates ---
function renderTemplates() {
    templatesContainer.style.display = 'block';
    templatesContainer.innerHTML = '<h2>Task Templates</h2><ul id="templatesList"></ul>'; // Clear and add heading/list container
    const templatesList = document.getElementById('templatesList');

    if (templates.length === 0) {
        templatesList.innerHTML = '<li><em>No templates saved yet.</em></li>';
        return;
    }

    templates.forEach(template => {
        const listItem = document.createElement('li');
        listItem.classList.add('template-item');
        listItem.dataset.id = template.id;

        const templateNameSpan = document.createElement('span');
        templateNameSpan.textContent = template.name;
        listItem.appendChild(templateNameSpan);

        const applyButton = document.createElement('button');
        applyButton.textContent = 'Apply';
        applyButton.addEventListener('click', () => {
            applyTemplate(template.id);
        });
        listItem.appendChild(applyButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => {
            deleteTemplate(template.id);
        });
        listItem.appendChild(deleteButton);

        templatesList.appendChild(listItem);
    });
}

function hideTemplates() {
    templatesContainer.style.display = 'none';
}

// --- Template Actions ---

async function applyTemplate(templateId) { // Make async
    // Fetch the template from Supabase
    const { data: template, error } = await supabase
        .from('templates')
        .select('task_data') // Select only the task_data column
        .eq('id', templateId)
        .single(); // Expecting a single row

    if (error) {
        console.error('Error fetching template:', error);
        alert('Error applying template. Could not fetch template data.');
        return; // Stop if fetch failed
    }

    if (!template || !template.task_data) {
        console.warn('Template not found or missing task_data:', templateId);
        alert('Template not found or template data is incomplete.');
        return;
    }

    // Create a new task based on the template's task_data
    const newTask = {
        id: Date.now(), // Keep client-generated ID for now (will change when tasks are in DB)
        text: template.task_data.text || '',
        completed: false, // Always start as not completed
        priority: template.task_data.priority || 'medium',
        dueDate: '', // Clear due date for a new task
        details: template.task_data.details || '',
        status: template.task_data.status || 'todo', // Default status
        tags: template.task_data.tags || [],
        subtasks: template.task_data.subtasks || [],
        links: template.task_data.links || [],
        goalId: null // New tasks are not linked to a goal by default
    };

    todos.push(newTask);
    // saveTodos(); // Remove this - will be replaced by saving individual tasks to Supabase later
    setView('list'); // Switch back to list view (or kanban depending on preference)
    renderTodoList(); // Re-render the todo list to show the new task
    if (currentView === 'kanban') renderKanban(todos); // Re-render kanban if active
    if (currentView === 'calendar') initCalendar(todos); // Re-render calendar if active
}

async function deleteTemplate(templateId) { // Make async
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        alert('Please sign in to delete templates.');
        return;
    }

    // Delete from Supabase, filtering by both template ID and user ID
    const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId) // Match by ID
        .eq('user_id', user.id); // Match by user ID

    if (error) {
        console.error('Error deleting template:', error);
        alert('Error deleting template. Please check the console.');
        return; // Stop if delete failed
    }

    console.log("Template deleted successfully:", templateId);

    // Remove from the local templates array after successful DB delete
    templates = templates.filter(t => t.id !== templateId);

    renderTemplates(); // Re-render the templates list
}

    // --- Goals (Scaffold) ---
    // --- Goals Rendering ---
    function renderGoals() {
        goalsContainer.style.display = 'block';
        const goalsList = document.getElementById('goalsList');
        goalsList.innerHTML = ''; // Clear existing list items

        if (goals.length === 0) {
            goalsList.innerHTML = '<li><em>No goals added yet.</em></li>';
            return;
        }

        goals.forEach(goal => {
            const listItem = document.createElement('li');
            listItem.classList.add('goal-item');
            listItem.dataset.id = goal.id;

            // Calculate progress
            const linkedTasks = todos.filter(task => task.goalId === goal.id);
            const completedTasks = linkedTasks.filter(task => task.completed).length;
            const totalTasks = linkedTasks.length;
            const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

            listItem.innerHTML = `
                <h3>${goal.name}</h3>
                <p>${goal.description || ''}</p>
                ${goal.targetDate ? `<p>Target Date: ${goal.targetDate}</p>` : ''}
                ${goal.metrics ? `<p>Metrics: ${goal.metrics}</p>` : ''}
                <div class="goal-progress">
                    <progress value="${progress}" max="100"></progress>
                    <span>${Math.round(progress)}% Complete (${completedTasks}/${totalTasks} tasks)</span>
                </div>
                <button class="mark-goal-complete" ${goal.completed ? 'disabled' : ''}>${goal.completed ? 'Completed' : 'Mark Complete'}</button>
                <button class="delete-goal">Delete</button>
            `;

            // Add event listeners for buttons
            listItem.querySelector('.mark-goal-complete').addEventListener('click', () => {
                markGoalComplete(goal.id);
            });
            listItem.querySelector('.delete-goal').addEventListener('click', () => {
                deleteGoal(goal.id);
            });

            goalsList.appendChild(listItem);
        });
    }

    function hideGoals() {
        goalsContainer.style.display = 'none';
    }

    // --- Goal Select Dropdown Population ---
    function populateGoalSelect() {
        const goalSelect = document.getElementById('goalSelect');
        goalSelect.innerHTML = '<option value="">Link to Goal (Optional)</option>'; // Default option

        goals.forEach(goal => {
            const option = document.createElement('option');
            option.value = goal.id;
            option.textContent = goal.name;
            goalSelect.appendChild(option);
        });
    }

    // --- Goal Actions ---
    async function handleAddGoal() { // Make async
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('Please sign in to add goals.');
            return;
        }

        const nameInput = document.getElementById('goalNameInput');
        const descriptionInput = document.getElementById('goalDescriptionInput');
        const targetDateInput = document.getElementById('goalTargetDateInput');
        const metricsInput = document.getElementById('goalMetricsInput'); // Corrected ID

        const name = nameInput.value.trim();
        if (!name) {
            alert('Goal name is required.');
            return;
        }

        // Prepare data for Supabase insertion (match table columns)
        const goalData = {
            name: name,
            description: descriptionInput.value.trim(),
            target_date: targetDateInput.value || null, // Use null if empty for Supabase date type
            metrics: metricsInput.value.trim(),
            user_id: user.id // Add the user ID
            // Default value for completed is handled by DB schema
        };

        console.log("Inserting goal:", goalData);

        try {
            // Use the Supabase client to insert the new goal data
            const { data: insertedGoal, error } = await supabase
                .from('goals')
                .insert(goalData) // Insert the single object
                .select()         // Select the inserted row to get the DB-generated ID
                .single();        // Expecting a single row back

            if (error) {
                console.error('Error inserting goal:', error);
                 if (error.message.includes('violates row-level security policy')) {
                      alert('Error adding goal: You might not have permission. Please ensure RLS policies are set correctly if enabled.');
                 } else {
                     alert(`Error adding goal: ${error.message}`);
                 }
                return; // Stop execution if there was an error
            }

            // If insertion was successful and data was returned
            if (insertedGoal) {
                 console.log("Goal inserted successfully:", insertedGoal);
                // Add the newly created goal (with the correct DB ID) to the local 'goals' array
                goals.push(insertedGoal);

                // Update the UI to reflect the new goal
                renderGoals(); // Re-render the goals list
                populateGoalSelect(); // Update the goal select dropdown

                // Clear input fields
                nameInput.value = '';
                descriptionInput.value = '';
                targetDateInput.value = '';
                metricsInput.value = '';
            } else {
                 // This case might happen if RLS prevents returning the inserted row, even if insert succeeded.
                 console.warn('Goal inserted, but no data returned. RLS might be configured to prevent reads after insert.');
                 // Optionally, reload all goals to ensure UI consistency, though less efficient.
                 // await loadGoals();
                 // renderGoals(); // Re-render goals
                 // populateGoalSelect(); // Update dropdown
                 alert('Goal added, but confirmation failed. The list might update on next refresh.');
                 // Still clear input fields
                 nameInput.value = '';
                 descriptionInput.value = '';
                 targetDateInput.value = '';
                 metricsInput.value = '';
            }

        } catch (err) {
            // Catch any unexpected errors during the async operation
            console.error('Unexpected error adding goal:', err);
            alert('An unexpected error occurred while adding the goal.');
        }
    }

    async function markGoalComplete(goalId) { // Make async
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('Please sign in to mark goals complete.');
            return;
        }

        const goalIndex = goals.findIndex(g => g.id === goalId);
        if (goalIndex !== -1) {
            // Update in Supabase, filtering by both goal ID and user ID
            const { data, error } = await supabase
                .from('goals')
                .update({ completed: true })
                .eq('id', goalId) // Match by ID
                .eq('user_id', user.id); // Match by user ID

            if (error) {
                console.error('Error marking goal complete:', error);
                alert('Error marking goal complete. Please check the console.');
                return; // Stop if update failed
            }

            console.log("Goal marked complete successfully:", data);

            // Update local array after successful DB update
            goals[goalIndex].completed = true;

            renderGoals(); // Re-render the goals list to show the updated status
        }
    }

    async function deleteGoal(goalId) { // Make async
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('Please sign in to delete goals.');
            return;
        }

        if (!confirm('Are you sure you want to delete this goal? This will also unlink any associated tasks.')) {
            return;
        }

        // Delete from Supabase, filtering by both goal ID and user ID
        const { error } = await supabase
            .from('goals')
            .delete()
            .eq('id', goalId) // Match by ID
            .eq('user_id', user.id); // Match by user ID

        if (error) {
            console.error('Error deleting goal:', error);
            alert('Error deleting goal. Please check the console.');
            return; // Stop if delete failed
        }

        console.log("Goal deleted successfully:", goalId);

        // Remove from the local goals array after successful DB delete
        goals = goals.filter(g => g.id !== goalId);

        // The database foreign key constraint (ON DELETE SET NULL) handles unlinking tasks.
        // We need to update the local todos array to reflect this change.
        // Iterating locally is likely faster than a full reload.
        todos.forEach(task => {
            if (task.goalId === goalId) {
                task.goalId = null;
            }
        });


        // Update UI
        renderGoals(); // Re-render the goals list
        populateGoalSelect(); // Update the goal select dropdown
        renderTodoList(); // Re-render todo list to update goal links display
        if (currentView === 'kanban') renderKanban(todos); // Re-render kanban if active
        if (currentView === 'calendar') initCalendar(todos); // Re-render calendar if active

    }

    // Add event listener for the Add Goal button
    const addGoalButton = document.getElementById('addGoalButton');
    if (addGoalButton) {
        addGoalButton.addEventListener('click', handleAddGoal);
    } else {
        console.warn('addGoalButton element not found!');
    }


    // --- AI Features Placeholder ---
    // Re-use the aiFeatures variable from above to avoid duplicate declaration
    if (aiFeatures) {
        aiFeatures.style.display = 'block';
    } else {
        console.warn('aiFeatures element not found!');
    }
    
    // Use a different variable name for this button to avoid conflict
    const aiSuggestButton = document.getElementById('ai-suggest-btn');
    if (aiSuggestButton) {
        aiSuggestButton.addEventListener('click', () => {
            alert('AI features coming soon!');
        });
    } else {
        console.warn('ai-suggest-btn element not found!');
    }


    // --- View Toggle Logic ---
    function setView(view) {
        currentView = view;
        hideQuill();
        hideKanban();
        hideCalendar();
        hideTemplates();
        hideGoals();
        todoList.style.display = 'none';
        if (view === 'list') todoList.style.display = 'block';
        if (view === 'kanban') renderKanban(todos);
        if (view === 'calendar') initCalendar(todos);
        if (view === 'templates') renderTemplates();
        if (view === 'goals') renderGoals(); // Call renderGoals without arguments
        
        // Update active button
        populateGoalSelect(); // Populate goal select on view change
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            btn.classList.remove('active');
            if(btn.dataset.view === view) {
                btn.classList.add('active');
            }
        });
    }
    
    // Set up view toggle buttons - both in the top bar and sidebar
    document.querySelectorAll('.view-toggle button').forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('View toggle button clicked:', btn.dataset.view);
            setView(btn.dataset.view);
        });
    });

    // Set up sidebar navigation items
    console.log('Setting up sidebar navigation');
    document.querySelectorAll('.sidebar-item').forEach(item => {
        console.log('Found sidebar item:', item.dataset.view);
        item.style.cursor = 'pointer'; // Make it visibly clickable
        item.addEventListener('click', () => {
            console.log('Sidebar item clicked:', item.dataset.view);
            setView(item.dataset.view);
        });
    });
    
    // Set up sidebar collapse button
    const sidebarCollapseBtn = document.querySelector('.sidebar-collapse-btn');
    if (sidebarCollapseBtn) {
        console.log('Setting up sidebar collapse button');
        sidebarCollapseBtn.style.cursor = 'pointer';
        sidebarCollapseBtn.addEventListener('click', () => {
            console.log('Sidebar collapse button clicked');
            const sidebar = document.querySelector('.notion-sidebar');
            const layout = document.querySelector('.notion-layout');
            if (sidebar && layout) {
                sidebar.classList.toggle('collapsed');
                layout.classList.toggle('sidebar-collapsed');
                
                // Change the icon direction when collapsed/expanded
                const icon = sidebarCollapseBtn.querySelector('i');
                if (icon) {
                    if (sidebar.classList.contains('collapsed')) {
                        icon.classList.remove('bx-chevron-left');
                        icon.classList.add('bx-chevron-right');
                    } else {
                        icon.classList.remove('bx-chevron-right');
                        icon.classList.add('bx-chevron-left');
                    }
                }
            }
        });
    } else {
        console.warn('Sidebar collapse button not found!');
    }
    
    // --- User Profile Settings Modal ---
    // References obtained later to ensure DOM readiness
    const displayNameInput = document.getElementById('display-name-input'); // Keep these as they are likely stable
    const newPasswordInput = document.getElementById('new-password-input');
    const confirmPasswordInput = document.getElementById('confirm-password-input');
    const saveProfileChangesButton = document.getElementById('save-profile-changes');
    const cancelProfileChangesButton = document.getElementById('cancel-profile-changes');

    function showProfileSettingsModal(user) {
        console.log('DEBUG: Entering showProfileSettingsModal');
        const profileSettingsModal = document.getElementById('profile-settings-modal'); // Get reference here
        if (!profileSettingsModal) {
            console.error('DEBUG: profile-settings-modal element NOT FOUND!');
            return;
        }
        console.log('DEBUG: Found profile-settings-modal element:', profileSettingsModal);

        // Populate display name if available
        displayNameInput.value = user.user_metadata?.display_name || user.email || '';
        console.log('DEBUG: Display name set to:', displayNameInput.value);
        // Clear password fields
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        profileSettingsModal.classList.add('visible');
        console.log('DEBUG: Added "visible" class to modal');
    }

    function hideProfileSettingsModal() {
        const profileSettingsModal = document.getElementById('profile-settings-modal'); // Get reference here too
        if (profileSettingsModal) {
            profileSettingsModal.classList.remove('visible');
        } else {
            console.error('DEBUG: profile-settings-modal element NOT FOUND during hide!');
        }
    }

    // Set up user profile click
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        console.log('DEBUG: Found .user-profile element:', userProfile);
        userProfile.style.cursor = 'pointer';
        userProfile.addEventListener('click', async () => { // Make click handler async
            console.log('DEBUG: User profile element clicked!');
            try {
                console.log('DEBUG: Attempting to fetch user...');
                const { data: { user }, error } = await supabase.auth.getUser();
                console.log('DEBUG: User fetch completed.');
                if (error) {
                    console.error('DEBUG: Error fetching user:', error);
                    alert('Could not fetch user data.');
                    return;
                }
                if (user) {
                    console.log('DEBUG: User found:', user);
                    showProfileSettingsModal(user);
                } else {
                    console.log('DEBUG: No user found.');
                    alert('Please sign in to view profile settings.');
                }
            } catch (err) {
                console.error('DEBUG: Exception in profile click handler:', err);
                alert('An unexpected error occurred.');
            }
        });
    } else {
        console.warn('DEBUG: .user-profile element not found!');
    }

    // Handle saving profile changes
    saveProfileChangesButton.addEventListener('click', async () => {
        const newDisplayName = displayNameInput.value.trim();
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        let updateData = {};
        let passwordChanged = false;

        // Check if display name has changed
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser && newDisplayName !== (currentUser.user_metadata?.display_name || currentUser.email || '')) {
            updateData.data = { display_name: newDisplayName };
        }

        // Check if password fields are filled and match
        if (newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                alert('New password and confirm password do not match.');
                return; // Stop if passwords don't match
            }
            if (newPassword.length < 6) { // Basic password length check
                alert('Password must be at least 6 characters long.');
                return;
            }
            updateData.password = newPassword;
            passwordChanged = true;
        }

        // Only attempt update if there are changes
        if (Object.keys(updateData).length === 0) {
            alert('No changes to save.');
            hideProfileSettingsModal();
            return;
        }

        console.log('Attempting to update user with data:', updateData);

        const { data, error } = await supabase.auth.updateUser(updateData);

        if (error) {
            console.error('Error updating user:', error);
            alert(`Error updating profile: ${error.message}`);
        } else {
            console.log('User updated successfully:', data);
            alert('Profile updated successfully!');
            hideProfileSettingsModal();
            // Optionally, refresh UI elements that show user name
            // For now, the display name update will be reflected on next page load or user fetch
        }
    });

    // Handle canceling profile changes
    cancelProfileChangesButton.addEventListener('click', () => {
        hideProfileSettingsModal();
    });

    // Add event listener for "Save as Template" button
    const saveAsTemplateButton = document.getElementById('saveAsTemplateButton');
    if (saveAsTemplateButton) { // Check if the button exists
        saveAsTemplateButton.addEventListener('click', async () => { // Make async
            if (currentEditingTaskId) {
                // Get the current user
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    alert('Please sign in to save templates.');
                    return;
                }

                const task = todos.find(t => t.id === currentEditingTaskId);
                if (task) {
                    const templateName = prompt('Enter a name for the template:');
                    if (templateName) {
                        // Prepare data for Supabase insertion (match table columns)
                        const templateData = {
                            name: templateName,
                            task_data: { // Store relevant task properties in task_data JSONB column
                                text: task.text,
                                priority: task.priority || 'medium',
                                details: task.details || '',
                                status: 'todo', // Default status for template tasks
                                tags: task.tags || [],
                                subtasks: task.subtasks || [],
                                links: task.links || []
                                // Exclude id, dueDate, completed, goalId from the template data
                            },
                            user_id: user.id // Add the user ID
                        };

                        console.log("Inserting template:", templateData);

                        try {
                            // Use the Supabase client to insert the new template data
                            const { data: insertedTemplate, error } = await supabase
                                .from('templates')
                                .insert(templateData) // Insert the single object
                                .select()             // Select the inserted row
                                .single();            // Expecting a single row back

                            if (error) {
                                console.error('Error inserting template:', error);
                                alert(`Error saving template: ${error.message}`);
                                return; // Stop execution if there was an error
                            }

                            // If insertion was successful and data was returned
                            if (insertedTemplate) {
                                console.log("Template inserted successfully:", insertedTemplate);
                                // Add the newly created template (with DB ID) to the local array
                                templates.push(insertedTemplate);

                                // Update UI
                                alert(`Template "${templateName}" saved!`);
                                hideQuill(); // Hide the editor after saving
                                setView('templates'); // Switch to templates view to see the new template
                            } else {
                                console.warn('Template inserted, but no data returned. RLS might be configured to prevent reads after insert.');
                                alert('Template saved, but confirmation failed. The list might update on next refresh.');
                                hideQuill(); // Still hide quill
                            }

                        } catch (err) {
                            console.error('Unexpected error saving template:', err);
                            alert('An unexpected error occurred while saving the template.');
                        }
                    }
                } else {
                    alert('Could not find the task to save as a template.');
                }
            } else {
                alert('Please open a task\'s details to save it as a template.');
            }
        });
    }
// --- AI Suggestion Feature ---
const aiSuggestionArea = document.getElementById('ai-suggestion-area');
const aiSuggestionText = document.getElementById('ai-suggestion-text');
const acceptSuggestionBtn = document.getElementById('accept-suggestion-btn');
const rejectSuggestionBtn = document.getElementById('reject-suggestion-btn');
const aiSuggestBtn = document.getElementById('ai-suggest-btn'); // Get the existing button

// Event listener for the AI Suggestion button
aiSuggestBtn.addEventListener('click', async () => {
    const taskText = todoInput.value.trim();
    if (taskText) {
        // Show loading state
        aiSuggestionText.textContent = 'Getting suggestion...';
        aiSuggestionArea.style.display = 'block';
        acceptSuggestionBtn.disabled = true;
        rejectSuggestionBtn.disabled = true;

        // Request AI suggestion from the backend service
        console.log(`Requesting AI suggestion for: "${taskInput}"`);

        // Show loading indicator or clear previous suggestion
        aiSuggestionText.textContent = 'Getting suggestion...';
        aiSuggestionArea.style.display = 'block';
        acceptSuggestionBtn.disabled = true;
        rejectSuggestionBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/ai-suggestion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ taskInput: taskInput }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            aiSuggestionText.textContent = data.suggestion;
            acceptSuggestionBtn.disabled = false;
            rejectSuggestionBtn.disabled = false;

        } catch (error) {
            console.error('Error fetching AI suggestion:', error);
            aiSuggestionText.textContent = `Error: ${error.message}`;
            aiSuggestionArea.style.display = 'block'; // Ensure area is visible to show error
            acceptSuggestionBtn.disabled = true;
            rejectSuggestionBtn.disabled = true;
        }

    } else {
        alert('Please enter a task before asking for a suggestion.');
    }
});

// Event listener for accepting the suggestion
acceptSuggestionBtn.addEventListener('click', () => {
    todoInput.value = aiSuggestionText.textContent; // Replace input with suggestion
    aiSuggestionArea.style.display = 'none'; // Hide suggestion area
});

// Event listener for rejecting the suggestion
rejectSuggestionBtn.addEventListener('click', () => {
    aiSuggestionArea.style.display = 'none'; // Hide suggestion area
});

// Function to handle the AI suggestion response
// This function will be called by the system when the 'ask' mode returns a result.
function handleAiSuggestionResponse(response) {
    try {
        // Assuming the response is the raw text from the 'ask' mode's attempt_completion result
        aiSuggestionText.textContent = response.trim();
        acceptSuggestionBtn.disabled = false;
        rejectSuggestionBtn.disabled = false;
    } catch (error) {
        console.error("Error handling AI suggestion response:", error);
        aiSuggestionText.textContent = 'Error getting suggestion.';
        acceptSuggestionBtn.disabled = true;
        rejectSuggestionBtn.disabled = true;
    }
}

// Expose the handler function globally so the system can call it
window.handleAiSuggestionResponse = handleAiSuggestionResponse;


// --- Data Model Extensions ---
// Each todo: {id, text, completed, priority, dueDate, details, status, tags, subtasks, links}
// Removed duplicate declarations - these are now declared inside DOMContentLoaded

// Goal object structure: { id, name, description, targetDate, metrics, linkedTasks: [], completed }

// --- Persistence Functions for Templates ---

// Save the current templates array to localStorage
function saveTemplates() {
    localStorage.setItem('templates', JSON.stringify(templates));
}

// Load templates from Supabase
async function loadTemplates() {
    console.log("Loading templates from Supabase...");
    try {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .order('created_at', { ascending: true }); // Optional: order by creation time

        if (error) {
            console.error('Error loading templates:', error);
            alert('Error loading templates. Please check the console.');
            return; // Exit if there's an error
        }

        templates = data || []; // Assign fetched data or empty array
        console.log("Templates loaded:", templates);

    } catch (err) {
        console.error('Unexpected error loading templates:', err);
        alert('An unexpected error occurred while loading templates.');
    }
}

// --- Internal Linking (Scaffold) ---
function parseLinks(text) {
    // Find [[Task Name]] and convert to clickable links
    return text.replace(/\[\[(.*?)\]\]/g, (match, p1) => `<a href="#" class="internal-link" data-link="${p1}">${p1}</a>`);
}

// --- Show Task Details (Rich Text) ---
function showTaskDetails(taskId) {
    const task = todos.find(t => t.id === taskId);
    if (!task) return;
    
    // Set the current editing task
    currentEditingTaskId = taskId;
    
    // Initialize the editor with task details
    initQuill(task.details || '');
    
    // Add a title to the editor to show which task is being edited
    const editorTitle = document.createElement('div');
    editorTitle.className = 'editor-title';
    editorTitle.textContent = `Editing: ${task.text}`;
    editorContainer.insertBefore(editorTitle, editorContainer.firstChild);
}

const todoInput = document.getElementById('todoInput');
const priorityInput = document.getElementById('priorityInput');
const dueDateInput = document.getElementById('dueDateInput');
const addButton = document.getElementById('addButton');

console.log({ addButton, todoInput, priorityInput, dueDateInput });

// --- Authentication Elements ---
const authContainer = document.getElementById('auth-container');
const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');
const resetPasswordForm = document.getElementById('reset-password-form');
const authMessage = document.getElementById('auth-message');

// Input and button references
const signupEmailInput = document.getElementById('signup-email');
const signupPasswordInput = document.getElementById('signup-password');
const signinEmailInput = document.getElementById('signin-email');
const signinPasswordInput = document.getElementById('signin-password');
const resetEmailInput = document.getElementById('reset-email');
const signupButton = document.getElementById('signup-button');
const signinButton = document.getElementById('signin-button');
const resetButton = document.getElementById('reset-button');
const rememberMeCheckbox = document.getElementById('remember-me');

// Social auth buttons
const googleSignupBtn = document.getElementById('google-signup');
const githubSignupBtn = document.getElementById('github-signup');
const googleSigninBtn = document.getElementById('google-signin');
const githubSigninBtn = document.getElementById('github-signin');

// Form navigation references
const showSigninLink = document.getElementById('show-signin');
const showSignupLink = document.getElementById('show-signup');
const forgotPasswordLink = document.getElementById('forgot-password');
const backToSigninLink = document.getElementById('back-to-signin');
const mainAppLayout = document.querySelector('.notion-layout'); // Reference to the main app layout

// Error message elements
const signupEmailError = document.getElementById('signup-email-error');
const signupPasswordError = document.getElementById('signup-password-error');
const signinEmailError = document.getElementById('signin-email-error');
const signinPasswordError = document.getElementById('signin-password-error');
const resetEmailError = document.getElementById('reset-email-error');

// Password strength elements
const passwordStrengthMeter = document.getElementById('password-strength-meter');
const passwordStrengthText = document.getElementById('password-strength-text');

// Password toggle visibility buttons
const passwordToggleBtns = document.querySelectorAll('.password-toggle');

// Message box elements
const messageTitle = document.getElementById('message-title');
const messageText = document.getElementById('message-text');
const messageClose = document.getElementById('message-close');
const successIcon = document.querySelector('.message-icon.success');
const errorIcon = document.querySelector('.message-icon.error');

// --- Authentication Event Listeners ---
// Form submission listeners
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        console.log("Sign up form submitted!");
        e.preventDefault();
        await handleSignUp();
    });
}

if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleSignIn();
    });
}

if (resetPasswordForm) {
    resetPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleResetPassword();
    });
}

// Form navigation listeners
if (showSignupLink) {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('signup');
    });
}

if (showSigninLink) {
    showSigninLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('signin');
    });
}

if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('reset');
    });
}

if (backToSigninLink) {
    backToSigninLink.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('signin');
    });
}

// Password toggle functionality
passwordToggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        const passwordField = this.parentElement.querySelector('input');
        const icon = this.querySelector('i');
        
        if (passwordField.type === 'password') {
            passwordField.type = 'text';
            icon.className = 'bx bx-show';
        } else {
            passwordField.type = 'password';
            icon.className = 'bx bx-hide';
        }
    });
});

// Social login buttons
if (googleSignupBtn) {
    googleSignupBtn.addEventListener('click', () => handleSocialAuth('google'));
}

if (githubSignupBtn) {
    githubSignupBtn.addEventListener('click', () => handleSocialAuth('github'));
}

if (googleSigninBtn) {
    googleSigninBtn.addEventListener('click', () => handleSocialAuth('google'));
}

if (githubSigninBtn) {
    githubSigninBtn.addEventListener('click', () => handleSocialAuth('github'));
}

// Password strength meter
if (signupPasswordInput) {
    signupPasswordInput.addEventListener('input', function() {
        updatePasswordStrength(this.value);
    });
}

// Message box close button
if (messageClose) {
    messageClose.addEventListener('click', function() {
        hideMessage();
    });
}

// --- Authentication Helper Functions ---
/**
 * Switches between different authentication forms
 * @param {string} formType - Type of form to show ('signin', 'signup', or 'reset')
 */
function switchForm(formType) {
    // Hide all forms first
    signupForm.classList.add('hidden');
    signinForm.classList.add('hidden');
    resetPasswordForm.classList.add('hidden');
    
    // Clear previous error messages
    clearErrors();
    
    // Show the requested form
    switch (formType) {
        case 'signup':
            signupForm.classList.remove('hidden');
            signupEmailInput.focus();
            break;
        case 'signin':
            signinForm.classList.remove('hidden');
            signinEmailInput.focus();
            break;
        case 'reset':
            resetPasswordForm.classList.remove('hidden');
            resetEmailInput.focus();
            break;
    }
}

/**
 * Validates an email address format
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Evaluates password strength
 * @param {string} password - Password to evaluate
 * @returns {Object} - Strength details
 */
function evaluatePasswordStrength(password) {
    // Password is empty
    if (!password) {
        return { score: 0, feedback: 'Password required' };
    }
    
    let score = 0;
    
    // Length check
    if (password.length < 8) {
        return { score: 1, feedback: 'Password is too short' };
    } else {
        score += Math.min(2, Math.floor(password.length / 8));
    }
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 1; // lowercase
    if (/[A-Z]/.test(password)) score += 1; // uppercase
    if (/\d/.test(password)) score += 1; // numbers
    if (/[^a-zA-Z\d]/.test(password)) score += 1; // special characters
    
    // Determine feedback based on score
    let feedback = '';
    if (score < 3) {
        feedback = 'Weak password';
    } else if (score < 5) {
        feedback = 'Medium strength';
    } else {
        feedback = 'Strong password';
    }
    
    return { score, feedback };
}

/**
 * Updates the password strength meter UI
 * @param {string} password - Password to evaluate
 */
function updatePasswordStrength(password) {
    const { score, feedback } = evaluatePasswordStrength(password);
    
    // Update the strength text
    passwordStrengthText.textContent = feedback;
    
    // Remove all classes first
    passwordStrengthMeter.classList.remove('weak', 'medium', 'strong');
    
    // Add appropriate class based on score
    if (score === 0) {
        passwordStrengthMeter.style.width = '0%';
    } else if (score < 3) {
        passwordStrengthMeter.classList.add('weak');
    } else if (score < 5) {
        passwordStrengthMeter.classList.add('medium');
    } else {
        passwordStrengthMeter.classList.add('strong');
    }
}

/**
 * Shows a message in the message box
 * @param {string} title - Message title
 * @param {string} text - Message body
 * @param {string} type - Message type ('success' or 'error')
 */
function showMessage(title, text, type = 'success') {
    messageTitle.textContent = title;
    messageText.textContent = text;
    
    successIcon.classList.add('hidden');
    errorIcon.classList.add('hidden');
    
    if (type === 'success') {
        successIcon.classList.remove('hidden');
    } else {
        errorIcon.classList.remove('hidden');
    }
    
    authMessage.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(hideMessage, 5000);
}

/**
 * Hides the message box
 */
function hideMessage() {
    authMessage.classList.add('hidden');
}

/**
 * Clears all error messages
 */
function clearErrors() {
    signupEmailError.textContent = '';
    signupPasswordError.textContent = '';
    signinEmailError.textContent = '';
    signinPasswordError.textContent = '';
    resetEmailError.textContent = '';
}

// --- Authentication Core Functions ---
/**
 * Handles the sign up process
 */
async function handleSignUp() {
    console.log("handleSignUp function called.");
    clearErrors();
    
    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value.trim();
    let hasError = false;

    // Validate email
    if (!email) {
        signupEmailError.textContent = 'Email is required';
        hasError = true;
    } else if (!isValidEmail(email)) {
        signupEmailError.textContent = 'Please enter a valid email address';
        hasError = true;
    }

    // Validate password
    if (!password) {
        signupPasswordError.textContent = 'Password is required';
        hasError = true;
    } else {
        const { score, feedback } = evaluatePasswordStrength(password);
        if (score < 3) {
            signupPasswordError.textContent = feedback;
            hasError = true;
        }
    }

    if (hasError) return;

    // Show loading state
    signupButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Creating account...';
    signupButton.disabled = true;

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin // Redirect URL after email confirmation
            }
        });

        if (error) {
            console.error('Error signing up:', error);
            signupButton.innerHTML = 'Create Account';
            signupButton.disabled = false;
            showMessage('Registration Failed', error.message, 'error');
        } else {
            console.log('Sign up successful:', data);
            signupButton.innerHTML = 'Create Account';
            signupButton.disabled = false;
            
            // Clear the form
            signupEmailInput.value = '';
            signupPasswordInput.value = '';
            
            if (data.user?.identities?.length === 0) {
                // User already exists but is trying to sign up again
                showMessage('Account Exists', 'This email is already registered. Please sign in instead.', 'error');
                switchForm('signin');
            } else if (data.user?.confirmed_at) {
                // Email already confirmed
                showMessage('Account Created', 'Your account has been created successfully! Please sign in.');
                switchForm('signin');
            } else {
                // Email confirmation required
                showMessage('Verification Required', 'Please check your email for a confirmation link to complete your registration.');
                switchForm('signin');
            }
        }
    } catch (err) {
        console.error('Unexpected error during signup:', err);
        signupButton.innerHTML = 'Create Account';
        signupButton.disabled = false;
        showMessage('Registration Failed', 'An unexpected error occurred. Please try again later.', 'error');
    }
}

/**
 * Handles the sign in process
 */
async function handleSignIn() {
    clearErrors();
    
    const email = signinEmailInput.value.trim();
    const password = signinPasswordInput.value.trim();
    let hasError = false;

    // Validate email
    if (!email) {
        signinEmailError.textContent = 'Email is required';
        hasError = true;
    } else if (!isValidEmail(email)) {
        signinEmailError.textContent = 'Please enter a valid email address';
        hasError = true;
    }

    // Validate password
    if (!password) {
        signinPasswordError.textContent = 'Password is required';
        hasError = true;
    }

    if (hasError) return;

    // Show loading state
    signinButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Signing in...';
    signinButton.disabled = true;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
            options: {
                remember: rememberMeCheckbox?.checked || false // Remember user if checkbox is checked
            }
        });

        if (error) {
            console.error('Error signing in:', error);
            signinButton.innerHTML = 'Sign In';
            signinButton.disabled = false;
            showMessage('Sign In Failed', error.message, 'error');
        } else {
            console.log('Sign in successful:', data);
            signinButton.innerHTML = 'Sign In';
            signinButton.disabled = false;
            // The onAuthStateChange listener will handle UI update and data loading
        }
    } catch (err) {
        console.error('Unexpected error during signin:', err);
        signinButton.innerHTML = 'Sign In';
        signinButton.disabled = false;
        showMessage('Sign In Failed', 'An unexpected error occurred. Please try again later.', 'error');
    }
}

/**
 * Handles the password reset request
 */
async function handleResetPassword() {
    clearErrors();
    
    const email = resetEmailInput.value.trim();
    let hasError = false;

    // Validate email
    if (!email) {
        resetEmailError.textContent = 'Email is required';
        hasError = true;
    } else if (!isValidEmail(email)) {
        resetEmailError.textContent = 'Please enter a valid email address';
        hasError = true;
    }

    if (hasError) return;

    // Show loading state
    resetButton.innerHTML = '<i class="bx bx-loader-alt bx-spin"></i> Sending...';
    resetButton.disabled = true;

    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`
        });

        resetButton.innerHTML = 'Send Reset Link';
        resetButton.disabled = false;

        if (error) {
            console.error('Error requesting password reset:', error);
            showMessage('Reset Failed', error.message, 'error');
        } else {
            resetEmailInput.value = '';
            showMessage('Email Sent', 'If an account exists for this email, you will receive password reset instructions.');
            switchForm('signin');
        }
    } catch (err) {
        console.error('Unexpected error during password reset request:', err);
        resetButton.innerHTML = 'Send Reset Link';
        resetButton.disabled = false;
        showMessage('Reset Failed', 'An unexpected error occurred. Please try again later.', 'error');
    }
}

/**
 * Handles the sign out process
 */
async function handleSignOut() {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error signing out:', error);
            showMessage('Sign Out Failed', error.message, 'error');
        } else {
            console.log('Sign out successful.');
            // The onAuthStateChange listener will handle UI update and data clearing
        }
    } catch (err) {
        console.error('Unexpected error during signout:', err);
        showMessage('Sign Out Failed', 'An unexpected error occurred. Please try again later.', 'error');
    }
}

/**
 * Handles social authentication with the given provider
 * @param {string} provider - The provider to authenticate with ('google' or 'github')
 */
async function handleSocialAuth(provider) {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) {
            console.error(`Error signing in with ${provider}:`, error);
            showMessage('Authentication Failed', error.message, 'error');
        }
    } catch (err) {
        console.error(`Unexpected error during ${provider} authentication:`, err);
        showMessage('Authentication Failed', 'An unexpected error occurred. Please try again later.', 'error');
    }
}

    // --- Authentication State Change Listener ---
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state change:', event, session);
        if (event === 'SIGNED_IN') {
            // User is signed in
            authContainer.classList.add('hidden');
            mainAppLayout.classList.remove('hidden'); // Show main app content
            document.body.classList.remove('auth-active'); // Remove body class

            // Load user-specific data
            await loadTodos();
            await loadGoals();
            await loadTemplates();

            // Render UI with loaded data
            ensureTaskStatus();
            populateGoalSelect();
            setView(currentView); // Render the appropriate view

            // Update user name display (assuming user object has a way to get name/email)
            const userNameSpan = document.querySelector('.user-name');
            if (userNameSpan && session?.user?.email) {
                 userNameSpan.textContent = session.user.email; // Or a profile name if available
            }


        } else if (event === 'SIGNED_OUT') {
            // User is signed out
            authContainer.classList.remove('hidden');
            mainAppLayout.classList.add('hidden'); // Hide main app content
            document.body.classList.add('auth-active'); // Add body class

            // Clear local data
            todos = [];
            goals = [];
            templates = [];

            // Clear UI
            renderTodoList(); // Clear todo list display
            renderGoals(); // Clear goals display
            renderTemplates(); // Clear templates display
            populateGoalSelect(); // Clear goal select dropdown

             // Reset user name display
             const userNameSpan = document.querySelector('.user-name');
             if (userNameSpan) {
                  userNameSpan.textContent = 'User'; // Or a default placeholder
             }
        }
    });

    // --- Initial Load Check ---
    // Check the initial session state when the page loads
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            // User is already signed in, the onAuthStateChange listener will handle the rest
            console.log("Initial session found. User is signed in.");
        } else {
            // No session found, show authentication forms
            console.log("No initial session found. Showing auth forms.");
            authContainer.classList.remove('hidden');
            mainAppLayout.classList.add('hidden');
            document.body.classList.add('auth-active');
        }
    });


// Removed duplicate declaration of todoList. Already declared at the top.


// Array to hold the todo items (source of truth)
// Already declared above; remove duplicate declaration.


// --- Persistence Functions ---

// Save the current todos array and goals to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    saveGoals(); // Also save goals
}

// Save the current goals array to localStorage
function saveGoals() {
    localStorage.setItem('goals', JSON.stringify(goals));
}

// Load todos from Supabase
async function loadTodos() {
    console.log("Loading todos from Supabase...");
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log("No user logged in. Not loading todos.");
        todos = []; // Clear local todos if no user
        return;
    }

    try {
        // Fetch tasks only for the current user
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id) // Filter by user ID
            .order('created_at', { ascending: true }); // Optional: order by creation time

        if (error) {
            console.error('Error loading todos:', error);
            alert('Error loading tasks. Please check the console.');
            return; // Exit if there's an error
        }

        todos = data || []; // Assign fetched data or empty array
        console.log("Todos loaded:", todos);

    } catch (err) {
        console.error('Unexpected error loading todos:', err);
        alert('An unexpected error occurred while loading tasks.');
    }
}

// Load goals from Supabase
async function loadGoals() {
    console.log("Loading goals from Supabase...");
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        console.log("No user logged in. Not loading goals.");
        goals = []; // Clear local goals if no user
        return;
    }

    try {
        // Fetch goals only for the current user
        const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id) // Filter by user ID
            .order('created_at', { ascending: true }); // Optional: order by creation time

        if (error) {
            console.error('Error loading goals:', error);
            alert('Error loading goals. Please check the console.');
            return; // Exit if there's an error
        }

        goals = data || []; // Assign fetched data or empty array
        console.log("Goals loaded:", goals);

    } catch (err) {
        console.error('Unexpected error loading goals:', err);
        alert('An unexpected error occurred while loading goals.');
    }
}

// Load goals from localStorage
// This function is likely no longer needed if using Supabase for persistence
// Keeping it commented out for now in case it's used elsewhere
/*
function loadGoals() {
    const storedGoals = localStorage.getItem('goals');
    if (storedGoals) {
        goals = JSON.parse(storedGoals);
    }
}
*/

// --- Rendering Functions ---

// Render the entire list based on the todos array
function renderTodoList() {
    if (currentView !== 'list') return;
    todoList.innerHTML = ''; // Clear existing list items
    todos.forEach(todo => {
        renderTodoItem(todo);
    });
}

// Ensure tasks loaded from storage have a status property
function ensureTaskStatus() {
    todos.forEach(todo => {
        if (!todo.hasOwnProperty('status')) {
            todo.status = 'todo'; // Default status
        }
    });
    // No need to save here, saving happens after loading in the auth state change handler
}

// Call ensureTaskStatus after loading todos
// This initial load logic will be replaced by the auth state change handler
/*
    loadTodos(); // Loads todos and goals
    loadTemplates(); // Load templates on startup
    ensureTaskStatus(); // Ensure all tasks have a status on load
    populateGoalSelect(); // Initial population of goal select dropdown
    setView(currentView); // Render the initial view
*/

// Render a single todo item and add its event listeners
function renderTodoItem(todo) {
    // Create list item elements
    const listItem = document.createElement('li');
    listItem.dataset.id = todo.id; // Store ID for reference

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;

    const taskSpan = document.createElement('span');
    // Support internal linking in task text
    taskSpan.innerHTML = parseLinks(todo.text);
    taskSpan.classList.add('task-text'); // Add class for styling/selection
    
    // Add visual indicator if the task has details
    if (todo.details && todo.details.trim() !== '') {
        const detailsIndicator = document.createElement('span');
        detailsIndicator.innerHTML = ' 📝';
        detailsIndicator.title = 'This task has details';
        detailsIndicator.className = 'details-indicator';
        taskSpan.appendChild(detailsIndicator);
    }
    
    // Make the task name clickable to show/edit details
    taskSpan.addEventListener('click', () => {
        showTaskDetails(todo.id);
    });
    listItem.appendChild(taskSpan); // Append the task text span
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('delete-button');

    // Apply 'completed' class if necessary
    if (todo.completed) {
        listItem.classList.add('completed');
    }
    const dueDateSpan = document.createElement('span');
    dueDateSpan.textContent = todo.dueDate ? `Due: ${todo.dueDate}` : 'No due date'; // Handle null due date
    dueDateSpan.classList.add('todo-due-date');
    listItem.appendChild(dueDateSpan);

    // Add notes toggle button
    const toggleNotesButton = document.createElement('button');
    toggleNotesButton.textContent = 'Show Notes';
    toggleNotesButton.classList.add('toggle-notes-button');
    listItem.appendChild(toggleNotesButton);

    // Add notes area (initially hidden)
    const notesArea = document.createElement('div');
    notesArea.classList.add('notes-area');
    notesArea.style.display = 'none'; // Hide by default

    const noteInput = document.createElement('textarea');
    noteInput.classList.add('note-input');
    noteInput.placeholder = 'Add a new note...';
    notesArea.appendChild(noteInput);

    const saveNoteButton = document.createElement('button');
    saveNoteButton.textContent = 'Save Note';
    saveNoteButton.classList.add('save-note-button');
    notesArea.appendChild(saveNoteButton);

    const todoNotesList = document.createElement('div'); // Or ul
    todoNotesList.classList.add('todo-notes-list');
    notesArea.appendChild(todoNotesList);

    listItem.appendChild(notesArea);

    // --- Event Listeners for the Item ---

    // Listener for marking as complete/incomplete
    // Listener for marking as complete/incomplete
    checkbox.addEventListener('change', async () => { // Make async
        const todoId = listItem.dataset.id; // Use string ID from dataset
        const targetTodo = todos.find(t => t.id === todoId);

        if (targetTodo) {
            const newCompletedStatus = checkbox.checked;

            // Update in Supabase
            const { data, error } = await supabase
                .from('tasks')
                .update({ completed: newCompletedStatus })
                .eq('id', todoId); // Match by ID

            if (error) {
                console.error('Error updating task completed status:', error);
                alert('Error updating task status. Please check the console.');
                // Revert checkbox state if update failed
                checkbox.checked = !newCompletedStatus;
                return;
            }

            // Update local array after successful DB update
            targetTodo.completed = newCompletedStatus;

            // Toggle class directly on the list item
            listItem.classList.toggle('completed', newCompletedStatus);

            // If in goals view, re-render goals to update progress
            if (currentView === 'goals') {
                renderGoals();
            }
        }
    });

    // Listener for deleting the item
    deleteButton.addEventListener('click', async () => { // Make async
        const todoId = listItem.dataset.id; // Use string ID

        // Optional: Confirm deletion with the user
        if (!confirm(`Are you sure you want to delete this task?`)) {
            return;
        }

        // Delete from Supabase
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', todoId); // Match by ID

        if (error) {
            console.error('Error deleting task:', error);
            alert('Error deleting task. Please check the console.');
            return; // Stop if delete failed
        }

        // Remove from the local todos array after successful DB delete
        todos = todos.filter(t => t.id !== todoId);

        // Remove from the DOM
        listItem.remove();

        // If in goals view, re-render goals to update progress
        if (currentView === 'goals') {
            renderGoals();
        }
    });

    // Listener for editing the item (double-click on text)
    taskSpan.addEventListener('dblclick', () => {
        const todoId = listItem.dataset.id; // Use string ID
        const targetTodo = todos.find(t => t.id === todoId);

        if (!targetTodo || listItem.classList.contains('editing')) {
            return; // Prevent editing if already editing or not found
        }

        listItem.classList.add('editing'); // Add editing class

        // Create input fields for editing
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = targetTodo.text;
        editInput.classList.add('edit-input'); // Add class for styling

        const prioritySelect = document.createElement('select');
        prioritySelect.classList.add('edit-priority-input');
        const priorities = ["low", "medium", "high"];
        priorities.forEach(priority => {
            const option = document.createElement('option');
            option.value = priority;
            option.textContent = priority.charAt(0).toUpperCase() + priority.slice(1);
            prioritySelect.appendChild(option);
        });
        prioritySelect.value = targetTodo.priority || 'medium'; // Set current or default

        const dueDateInput = document.createElement('input');
        dueDateInput.type = 'date';
        dueDateInput.classList.add('edit-due-date-input');
        dueDateInput.value = targetTodo.dueDate || ''; // Set current or empty

        // Temporarily hide display elements and replace with inputs
        taskSpan.style.display = 'none';
        listItem.querySelector('.todo-priority').style.display = 'none';
        listItem.querySelector('.todo-due-date').style.display = 'none';

        listItem.insertBefore(editInput, taskSpan.nextSibling);
        listItem.insertBefore(prioritySelect, editInput.nextSibling);
        listItem.insertBefore(dueDateInput, prioritySelect.nextSibling);

        editInput.focus(); // Focus the text input field

        // Function to save edit and revert UI
        const saveEdit = async () => { // Make async
            const todoId = listItem.dataset.id; // Get the task ID
            const newText = editInput.value.trim();
            const newPriority = prioritySelect.value;
            const newDueDate = dueDateInput.value || null; // Use null if empty

            // Prepare data for Supabase update
            const updatedData = {
                text: newText,
                priority: newPriority,
                due_date: newDueDate // Column name is due_date
            };

            console.log(`Updating task ${todoId} with:`, updatedData);

            // Update in Supabase
            const { data, error } = await supabase
                .from('tasks')
                .update(updatedData)
                .eq('id', todoId); // Match by ID

            if (error) {
                console.error('Error updating task:', error);
                alert('Error saving task details. Please check the console.');
                // Optionally, revert the UI changes here if the update failed
                return; // Stop if update failed
            }

            console.log("Task updated successfully:", data);

            // Update local todo object after successful DB update
            targetTodo.text = newText;
            targetTodo.priority = newPriority;
            targetTodo.dueDate = newDueDate; // Update local object with potentially null date

            // Update display elements
            taskSpan.innerHTML = parseLinks(targetTodo.text); // Re-parse links
            // Re-add details indicator if needed
             if (targetTodo.details && targetTodo.details.trim() !== '') {
                const detailsIndicator = document.createElement('span');
                detailsIndicator.innerHTML = ' 📝';
                detailsIndicator.title = 'This task has details';
                detailsIndicator.className = 'details-indicator';
                taskSpan.appendChild(detailsIndicator);
            }

            // Update priority display
            const prioritySpan = listItem.querySelector('.todo-priority');
            if (prioritySpan) {
                 prioritySpan.textContent = targetTodo.priority ? `Priority: ${targetTodo.priority.charAt(0).toUpperCase() + targetTodo.priority.slice(1)}` : 'No priority';
                 prioritySpan.className = `todo-priority priority-${targetTodo.priority || 'medium'}`; // Update class for styling
            }


            // Update due date display
            const dueDateDisplaySpan = listItem.querySelector('.todo-due-date');
            if (dueDateDisplaySpan) {
                dueDateDisplaySpan.textContent = targetTodo.dueDate ? `Due: ${targetTodo.dueDate}` : 'No due date';
            }


            // Show display elements and remove inputs
            taskSpan.style.display = '';
            const priorityDisplay = listItem.querySelector('.todo-priority');
            if (priorityDisplay) priorityDisplay.style.display = '';
            const dueDateDisplay = listItem.querySelector('.todo-due-date');
            if (dueDateDisplay) dueDateDisplay.style.display = '';


            editInput.remove();
            prioritySelect.remove();
            dueDateInput.remove();

            listItem.classList.remove('editing'); // Remove editing class

            // If in goals view, re-render goals to update progress if task was linked
            if (currentView === 'goals' && targetTodo.goalId) {
                renderGoals();
            }
        };

        // Save on blur (losing focus)
        editInput.addEventListener('blur', saveEdit);
        prioritySelect.addEventListener('blur', saveEdit);
        dueDateInput.addEventListener('blur', saveEdit);


        // Save on Enter key press in text input
        editInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                editInput.blur(); // Trigger blur to save
            }
        });
    });

    // Listener for toggling notes area visibility
    toggleNotesButton.addEventListener('click', () => {
        const notesArea = listItem.querySelector('.notes-area');
        const isHidden = notesArea.style.display === 'none';
        notesArea.style.display = isHidden ? 'block' : 'none';
        toggleNotesButton.textContent = isHidden ? 'Hide Notes' : 'Show Notes';

        if (isHidden) {
            // If showing, render the notes for this todo
            const todoId = parseInt(listItem.dataset.id);
            const targetTodo = todos.find(t => t.id === todoId);
            if (targetTodo) {
                renderNotes(targetTodo.id, targetTodo.notes);
            }
        }
    });

    // Listener for saving a new note
    saveNoteButton.addEventListener('click', () => {
        const todoId = parseInt(listItem.dataset.id);
        const targetTodo = todos.find(t => t.id === todoId);
        const noteInput = listItem.querySelector('.note-input');
        const noteText = noteInput.value.trim();

        if (targetTodo && noteText !== '') {
            const newNote = {
                id: Date.now(), // Simple unique ID for the note
                text: noteText
            };
            targetTodo.notes.push(newNote);
            saveTodos(); // Save the updated todos array
            renderNoteItemElement(todoId, newNote); // Render the new note
            noteInput.value = ''; // Clear the input
        }
    });


    // Add the new item to the list in the DOM
    todoList.appendChild(listItem);
}

// Function to render notes for a specific todo item
function renderNotes(todoId, notes) {
    const listItem = todoList.querySelector(`li[data-id="${todoId}"]`);
    if (!listItem) return;

    const todoNotesList = listItem.querySelector('.todo-notes-list');
        todoNotesList.innerHTML = ''; // Clear existing notes

        notes.forEach(note => {
            renderNoteItemElement(todoId, note);
        });
    }

    // Function to render a single note element within a todo item
    function renderNoteItemElement(todoId, note) {
        const listItem = todoList.querySelector(`li[data-id="${todoId}"]`);
        if (!listItem) return;

        const todoNotesList = listItem.querySelector('.todo-notes-list');
        const noteElement = document.createElement('div'); // Or li
        noteElement.dataset.id = note.id;
        noteElement.classList.add('note-item'); // Add class for styling

        const noteText = document.createElement('span');
        noteText.textContent = note.text;
        noteElement.appendChild(noteText);

        // Add a delete button for notes
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete Note';
        deleteButton.classList.add('delete-note-button'); // Add class for styling
        deleteButton.addEventListener('click', () => {
            deleteTodoNote(todoId, note.id);
        });
        noteElement.appendChild(deleteButton);

        todoNotesList.appendChild(noteElement);
    }

    // Function to delete a note from a specific todo
    function deleteTodoNote(todoId, noteId) {
        const targetTodo = todos.find(t => t.id === todoId);
        if (targetTodo) {
            targetTodo.notes = targetTodo.notes.filter(note => note.id !== noteId);
            saveTodos(); // Save changes
            // Remove from the DOM
            const noteElement = document.querySelector(`li[data-id="${todoId}"] .note-item[data-id="${noteId}"]`);
            if (noteElement) {
                noteElement.remove();
            }
        }
    }


    // --- Initial Setup and Event Listeners ---

    // Example: Add view toggle on load
    setView('list');
    // Function to add a new todo from the input field
    async function handleAddTodo() { // Make async
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            alert('Please sign in to add tasks.');
            return;
        }

        const text = todoInput.value.trim();
        const priority = priorityInput.value;
        const dueDate = dueDateInput.value || null; // Use null if empty for Supabase date type
        const goalSelect = document.getElementById('goalSelect');
        const selectedGoalId = goalSelect.value || null; // Use null if no goal selected. Assumes goal IDs are UUIDs from DB now.

        if (text === '') {
            alert('Please enter a task.');
            return;
        }

        // Prepare data for Supabase insertion (match table columns)
        const taskData = {
            text: text,
            priority: priority,
            due_date: dueDate, // Column name is due_date
            goal_id: selectedGoalId, // Column name is goal_id
            user_id: user.id // Add the user ID
            // Default values for completed, status, details, tags, subtasks, links are handled by DB schema
        };

        console.log("Inserting task:", taskData);

        try {
            // Use the Supabase client to insert the new task data
            const { data: insertedTask, error } = await supabase
                .from('tasks')
                .insert(taskData) // Insert the single object
                .select()         // Select the inserted row to get the DB-generated ID
                .single();        // Expecting a single row back

            if (error) {
                console.error('Error inserting task:', error);
                // Provide more specific feedback if possible (e.g., RLS issues)
                if (error.message.includes('violates row-level security policy')) {
                     alert('Error adding task: You might not have permission. Please ensure RLS policies are set correctly if enabled.');
                } else {
                    alert(`Error adding task: ${error.message}`);
                }
                return; // Stop execution if there was an error
            }

            // If insertion was successful and data was returned
            if (insertedTask) {
                 console.log("Task inserted successfully:", insertedTask);
                // Add the newly created task (with the correct DB ID) to the local 'todos' array
                todos.push(insertedTask);

                // Update the UI to reflect the new task
                renderTodoList(); // Re-render the main list view
                // Conditionally re-render other views if they are active
                if (currentView === 'kanban') renderKanban(todos);
                if (currentView === 'calendar') initCalendar(todos);
                // If the task was linked to a goal and the goals view is active, re-render goals to show progress update
                if (currentView === 'goals' && selectedGoalId) {
                    renderGoals();
                }
                resetInputs(); // Clear the input fields
            } else {
                 // This case might happen if RLS prevents returning the inserted row, even if insert succeeded.
                 console.warn('Task inserted, but no data returned. RLS might be configured to prevent reads after insert.');
                 // Optionally, reload all tasks to ensure UI consistency, though less efficient.
                 // await loadTodos();
                 // setView(currentView); // Re-render view
                 alert('Task added, but confirmation failed. The list might update on next refresh.');
                 resetInputs(); // Still reset inputs
            }

        } catch (err) {
            // Catch any unexpected errors during the async operation
            console.error('Unexpected error adding task:', err);
            alert('An unexpected error occurred while adding the task.');
        }
    }

    // Ensure priority and due date inputs are reset after adding
    function resetInputs() {
        todoInput.value = '';
        priorityInput.value = 'medium'; // Reset priority to default
        dueDateInput.value = ''; // Clear due date
        document.getElementById('goalSelect').value = ''; // Reset goal select
    }

// Add item when the button is clicked
console.log('Setting up Add Task button, reference:', addButton);
if (!addButton) {
    console.error("addButton not found in DOM! Check your HTML for an element with id='addButton'");
} else {
    // Remove any existing event listeners to prevent duplicates
    const newAddButton = addButton.cloneNode(true);
    addButton.parentNode.replaceChild(newAddButton, addButton);
    
    // Re-assign the variable to the new element
    addButton = newAddButton;
    
    console.log('Adding click event listener to addButton');
    addButton.addEventListener('click', function(e) {
        console.log('Add Task button clicked!'); 
        e.preventDefault();
        handleAddTodo();
    });
    
    // Make button visibly clickable with cursor style
    addButton.style.cursor = 'pointer';
}

// Add item when Enter is pressed in the input
// Add support for tags and status in the UI later
todoInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        handleAddTodo();
        }
    });

    // Load initial data from Supabase
    console.log("Loading initial data...");
    try {
        await Promise.all([
            loadTodos(),
            loadGoals(),
            loadTemplates()
        ]);
        console.log("Initial data loaded.");

        // Now that data is loaded, populate UI elements and render the view
        ensureTaskStatus(); // Ensure all tasks have a status after loading
        populateGoalSelect(); // Populate goal select dropdown with loaded goals
        setView(currentView); // Render the initial view with loaded data

    } catch (error) {
        console.error("Error during initial data load:", error);
        alert("Failed to load initial application data. Please check the console and refresh.");
    }
});