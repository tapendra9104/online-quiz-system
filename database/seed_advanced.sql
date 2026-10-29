-- ============================================================
-- Advanced BTech Lecture & Lab Quizzes — Seed Data
-- ============================================================
USE online_quiz_system;

-- ════════════════════════════════════════════════════════════
-- QUIZ 3: Data Structures & Algorithms (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Data Structures & Algorithms', 'Test your knowledge of fundamental data structures including arrays, linked lists, trees, and graphs.', 'Computer Science', 'Lecture Quiz', 600, 3, 5, 'published', 1);
SET @q3 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q3, 'What is the time complexity of searching in a balanced Binary Search Tree?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'O(n)', 0), (@qn, 'B', 'O(log n)', 1), (@qn, 'C', 'O(n²)', 0), (@qn, 'D', 'O(1)', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q3, 'Which data structure uses FIFO (First In, First Out) principle?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Stack', 0), (@qn, 'B', 'Queue', 1), (@qn, 'C', 'Binary Tree', 0), (@qn, 'D', 'Hash Map', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q3, 'What is the worst-case time complexity of QuickSort?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'O(n log n)', 0), (@qn, 'B', 'O(n)', 0), (@qn, 'C', 'O(n²)', 1), (@qn, 'D', 'O(log n)', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q3, 'Which traversal of a Binary Search Tree gives sorted output?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Preorder', 0), (@qn, 'B', 'Postorder', 0), (@qn, 'C', 'Inorder', 1), (@qn, 'D', 'Level Order', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q3, 'A graph traversal algorithm that uses a queue is called?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Depth First Search (DFS)', 0), (@qn, 'B', 'Breadth First Search (BFS)', 1), (@qn, 'C', 'Dijkstra\'s Algorithm', 0), (@qn, 'D', 'Bellman-Ford', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 4: DSA Lab Quiz
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('DSA Lab Quiz — Linked Lists & Stacks', 'Hands-on lab questions on implementing linked lists, stacks, and their operations in C/C++.', 'Computer Science', 'Lab Quiz', 480, 3, 5, 'published', 1);
SET @q4 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q4, 'In a singly linked list, what does the last node''s next pointer point to?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'The head node', 0), (@qn, 'B', 'NULL', 1), (@qn, 'C', 'Itself', 0), (@qn, 'D', 'The previous node', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q4, 'Which operation has O(1) time complexity in a stack implemented using an array?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Search', 0), (@qn, 'B', 'Sort', 0), (@qn, 'C', 'Push and Pop', 1), (@qn, 'D', 'Traverse', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q4, 'What is a stack overflow condition?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Popping from an empty stack', 0), (@qn, 'B', 'Pushing to a full stack', 1), (@qn, 'C', 'Deleting the head node', 0), (@qn, 'D', 'Reversing a linked list', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q4, 'To reverse a singly linked list, how many pointers are typically needed?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '1 (current)', 0), (@qn, 'B', '2 (current, next)', 0), (@qn, 'C', '3 (prev, current, next)', 1), (@qn, 'D', '4', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q4, 'Which application commonly uses a stack data structure?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'CPU Scheduling', 0), (@qn, 'B', 'Function call management (Recursion)', 1), (@qn, 'C', 'Printer spooling', 0), (@qn, 'D', 'File system indexing', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 5: Database Management Systems (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Database Management Systems', 'Covers SQL, normalization, ER diagrams, transactions, and relational algebra.', 'Computer Science', 'Lecture Quiz', 600, 4, 6, 'published', 1);
SET @q5 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q5, 'Which normal form eliminates transitive dependencies?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'First Normal Form (1NF)', 0), (@qn, 'B', 'Second Normal Form (2NF)', 0), (@qn, 'C', 'Third Normal Form (3NF)', 1), (@qn, 'D', 'BCNF', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q5, 'The ACID properties in database transactions stand for?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Atomicity, Consistency, Isolation, Durability', 1), (@qn, 'B', 'Association, Consistency, Integrity, Durability', 0), (@qn, 'C', 'Atomicity, Concurrency, Isolation, Data', 0), (@qn, 'D', 'Authentication, Consistency, Isolation, Dependency', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q5, 'Which SQL clause is used to filter groups in aggregate queries?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'WHERE', 0), (@qn, 'B', 'GROUP BY', 0), (@qn, 'C', 'HAVING', 1), (@qn, 'D', 'ORDER BY', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q5, 'A foreign key is used to?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Uniquely identify a record', 0), (@qn, 'B', 'Establish a relationship between two tables', 1), (@qn, 'C', 'Index a column for faster search', 0), (@qn, 'D', 'Encrypt sensitive data', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q5, 'Which type of JOIN returns all rows from both tables, matching where possible?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'INNER JOIN', 0), (@qn, 'B', 'LEFT JOIN', 0), (@qn, 'C', 'RIGHT JOIN', 0), (@qn, 'D', 'FULL OUTER JOIN', 1);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q5, 'What is a deadlock in database systems?', 1, 6);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'When a query takes too long to execute', 0), (@qn, 'B', 'When two transactions wait for each other to release locks', 1), (@qn, 'C', 'When the database runs out of storage', 0), (@qn, 'D', 'When an index becomes corrupted', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 6: DBMS Lab Quiz
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('DBMS Lab Quiz — SQL Queries', 'Practical SQL query writing, stored procedures, triggers, and schema design.', 'Computer Science', 'Lab Quiz', 480, 3, 5, 'published', 1);
SET @q6 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q6, 'Which SQL command is used to remove all rows from a table without deleting the table?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'DELETE TABLE', 0), (@qn, 'B', 'DROP TABLE', 0), (@qn, 'C', 'TRUNCATE TABLE', 1), (@qn, 'D', 'REMOVE TABLE', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q6, 'What is the output of: SELECT COUNT(*) FROM students WHERE marks > 80;', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Total number of students', 0), (@qn, 'B', 'Count of students with marks > 80', 1), (@qn, 'C', 'Sum of all marks', 0), (@qn, 'D', 'Average marks above 80', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q6, 'A stored procedure in MySQL is created using which keyword?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'CREATE FUNCTION', 0), (@qn, 'B', 'CREATE PROCEDURE', 1), (@qn, 'C', 'CREATE TRIGGER', 0), (@qn, 'D', 'CREATE VIEW', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q6, 'Which constraint ensures that a column cannot have NULL values?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'UNIQUE', 0), (@qn, 'B', 'CHECK', 0), (@qn, 'C', 'NOT NULL', 1), (@qn, 'D', 'DEFAULT', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q6, 'Which SQL statement is used to add a new column to an existing table?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'ALTER TABLE ... ADD COLUMN', 1), (@qn, 'B', 'UPDATE TABLE ... ADD', 0), (@qn, 'C', 'INSERT COLUMN INTO', 0), (@qn, 'D', 'MODIFY TABLE ... ADD', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 7: Operating Systems (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Operating Systems — Process & Memory Management', 'Covers process scheduling, memory management, virtual memory, deadlocks, and file systems.', 'Computer Science', 'Lecture Quiz', 720, 4, 6, 'published', 1);
SET @q7 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q7, 'Which CPU scheduling algorithm may cause starvation?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Round Robin', 0), (@qn, 'B', 'Shortest Job First (SJF)', 1), (@qn, 'C', 'First Come First Serve', 0), (@qn, 'D', 'FIFO', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q7, 'What is thrashing in operating systems?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'CPU overheating due to heavy load', 0), (@qn, 'B', 'Excessive paging causing CPU utilization to drop', 1), (@qn, 'C', 'Memory leak in applications', 0), (@qn, 'D', 'Disk fragmentation', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q7, 'The Banker''s algorithm is used for?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Process scheduling', 0), (@qn, 'B', 'Memory allocation', 0), (@qn, 'C', 'Deadlock avoidance', 1), (@qn, 'D', 'Disk scheduling', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q7, 'Which page replacement algorithm is considered optimal?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'LRU (Least Recently Used)', 0), (@qn, 'B', 'FIFO (First In First Out)', 0), (@qn, 'C', 'Optimal (OPT) — replaces page not used for longest time', 1), (@qn, 'D', 'Random Replacement', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q7, 'A semaphore is used for?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Process synchronization', 1), (@qn, 'B', 'CPU scheduling', 0), (@qn, 'C', 'Memory compression', 0), (@qn, 'D', 'File encryption', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q7, 'In a multi-level feedback queue scheduler, a process that uses too much CPU time is?', 1, 6);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Terminated immediately', 0), (@qn, 'B', 'Moved to a lower priority queue', 1), (@qn, 'C', 'Given more CPU time', 0), (@qn, 'D', 'Moved to swap space', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 8: Computer Networks (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Computer Networks — TCP/IP & Protocols', 'OSI model, TCP/IP, routing protocols, DNS, HTTP, and network security fundamentals.', 'Computer Science', 'Lecture Quiz', 600, 3, 5, 'published', 1);
SET @q8 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q8, 'How many layers does the OSI model have?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '5', 0), (@qn, 'B', '6', 0), (@qn, 'C', '7', 1), (@qn, 'D', '4', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q8, 'Which protocol is used to resolve domain names to IP addresses?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'FTP', 0), (@qn, 'B', 'DNS', 1), (@qn, 'C', 'DHCP', 0), (@qn, 'D', 'ARP', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q8, 'TCP is a _____ protocol.', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Connectionless', 0), (@qn, 'B', 'Connection-oriented', 1), (@qn, 'C', 'Stateless', 0), (@qn, 'D', 'Half-duplex only', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q8, 'What is the default port number for HTTPS?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '80', 0), (@qn, 'B', '8080', 0), (@qn, 'C', '443', 1), (@qn, 'D', '22', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q8, 'Which layer of the OSI model is responsible for routing?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Data Link Layer', 0), (@qn, 'B', 'Network Layer', 1), (@qn, 'C', 'Transport Layer', 0), (@qn, 'D', 'Session Layer', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 9: Computer Networks Lab
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Networks Lab — Socket Programming & Wireshark', 'Practical questions on socket programming in Python/C, packet analysis, and network configuration.', 'Computer Science', 'Lab Quiz', 480, 3, 5, 'published', 1);
SET @q9 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q9, 'In socket programming, which function is called by the server to wait for client connections?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'connect()', 0), (@qn, 'B', 'listen() followed by accept()', 1), (@qn, 'C', 'send()', 0), (@qn, 'D', 'bind() only', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q9, 'The command "ping" uses which protocol?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'TCP', 0), (@qn, 'B', 'UDP', 0), (@qn, 'C', 'ICMP', 1), (@qn, 'D', 'HTTP', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q9, 'Which tool is commonly used for network packet capturing and analysis?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Visual Studio Code', 0), (@qn, 'B', 'Wireshark', 1), (@qn, 'C', 'Postman', 0), (@qn, 'D', 'Git', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q9, 'What does the "traceroute" (tracert on Windows) command show?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'All connected devices on the network', 0), (@qn, 'B', 'The route packets take to reach a destination', 1), (@qn, 'C', 'Open ports on a server', 0), (@qn, 'D', 'Network bandwidth speed', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q9, 'In Python socket programming, socket.AF_INET refers to?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Unix domain sockets', 0), (@qn, 'B', 'IPv4 address family', 1), (@qn, 'C', 'IPv6 address family', 0), (@qn, 'D', 'Bluetooth sockets', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 10: Machine Learning (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Machine Learning Fundamentals', 'Supervised & unsupervised learning, regression, classification, neural networks, and evaluation metrics.', 'Artificial Intelligence', 'Lecture Quiz', 720, 4, 6, 'published', 1);
SET @q10 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q10, 'Which of the following is a supervised learning algorithm?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'K-Means Clustering', 0), (@qn, 'B', 'Linear Regression', 1), (@qn, 'C', 'DBSCAN', 0), (@qn, 'D', 'PCA', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q10, 'Overfitting in a machine learning model means?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Model performs well on both training and test data', 0), (@qn, 'B', 'Model performs well on training data but poorly on test data', 1), (@qn, 'C', 'Model performs poorly on training data', 0), (@qn, 'D', 'Model has too few parameters', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q10, 'The activation function commonly used in the output layer for binary classification is?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'ReLU', 0), (@qn, 'B', 'Tanh', 0), (@qn, 'C', 'Sigmoid', 1), (@qn, 'D', 'Softmax', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q10, 'Which metric is most appropriate for imbalanced classification problems?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Accuracy', 0), (@qn, 'B', 'F1-Score', 1), (@qn, 'C', 'Mean Squared Error', 0), (@qn, 'D', 'R² Score', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q10, 'Gradient descent is used to?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Increase the learning rate', 0), (@qn, 'B', 'Minimize the loss/cost function', 1), (@qn, 'C', 'Select features', 0), (@qn, 'D', 'Split data into train/test sets', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q10, 'Random Forest is an ensemble of?', 1, 6);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Support Vector Machines', 0), (@qn, 'B', 'Decision Trees', 1), (@qn, 'C', 'Neural Networks', 0), (@qn, 'D', 'K-Nearest Neighbors', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 11: ML Lab Quiz
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('ML Lab — Scikit-learn & Model Training', 'Practical questions on using Scikit-learn, pandas, data preprocessing, and model evaluation.', 'Artificial Intelligence', 'Lab Quiz', 480, 3, 5, 'published', 1);
SET @q11 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q11, 'In Scikit-learn, which method is used to train a model?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'model.predict()', 0), (@qn, 'B', 'model.fit()', 1), (@qn, 'C', 'model.train()', 0), (@qn, 'D', 'model.compile()', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q11, 'Which pandas function is used to check for missing values?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'df.describe()', 0), (@qn, 'B', 'df.isnull().sum()', 1), (@qn, 'C', 'df.head()', 0), (@qn, 'D', 'df.shape', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q11, 'train_test_split with test_size=0.2 means?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '20% training, 80% testing', 0), (@qn, 'B', '80% training, 20% testing', 1), (@qn, 'C', '20% for validation', 0), (@qn, 'D', 'Split into 2 equal parts', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q11, 'Which technique is used to prevent overfitting in neural networks?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Increasing the number of layers', 0), (@qn, 'B', 'Dropout regularization', 1), (@qn, 'C', 'Increasing learning rate', 0), (@qn, 'D', 'Removing all hidden layers', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q11, 'StandardScaler in Scikit-learn performs?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'One-hot encoding', 0), (@qn, 'B', 'Feature scaling (zero mean, unit variance)', 1), (@qn, 'C', 'Dimensionality reduction', 0), (@qn, 'D', 'Missing value imputation', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 12: Software Engineering (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Software Engineering — SDLC & Design Patterns', 'Software development life cycles, Agile, design patterns, testing methodologies, and UML diagrams.', 'Software Engineering', 'Lecture Quiz', 600, 3, 5, 'published', 1);
SET @q12 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q12, 'Which SDLC model is best for projects with frequently changing requirements?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Waterfall Model', 0), (@qn, 'B', 'Agile Model', 1), (@qn, 'C', 'V-Model', 0), (@qn, 'D', 'Big Bang Model', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q12, 'The Singleton design pattern ensures?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Multiple instances of a class', 0), (@qn, 'B', 'Only one instance of a class exists', 1), (@qn, 'C', 'Inheritance between classes', 0), (@qn, 'D', 'Interface segregation', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q12, 'Unit testing focuses on testing?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'The complete system end-to-end', 0), (@qn, 'B', 'Individual functions or methods', 1), (@qn, 'C', 'User interface only', 0), (@qn, 'D', 'Database connections', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q12, 'In Agile, a "Sprint" is typically?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'A 6-month development phase', 0), (@qn, 'B', 'A 1-4 week development iteration', 1), (@qn, 'C', 'A one-time deployment', 0), (@qn, 'D', 'A bug-fixing session', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q12, 'Which UML diagram shows the interaction between objects over time?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Class Diagram', 0), (@qn, 'B', 'Sequence Diagram', 1), (@qn, 'C', 'Use Case Diagram', 0), (@qn, 'D', 'Activity Diagram', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 13: Web Development Lab
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Web Development Lab — HTML, CSS & JavaScript', 'Practical questions on building responsive web pages, DOM manipulation, and modern CSS.', 'Web Development', 'Lab Quiz', 480, 3, 5, 'published', 1);
SET @q13 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q13, 'Which CSS property is used to make a layout responsive using flexbox?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'display: block', 0), (@qn, 'B', 'display: flex', 1), (@qn, 'C', 'display: inline', 0), (@qn, 'D', 'display: table', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q13, 'document.querySelector(''#myId'') selects elements by?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Tag name', 0), (@qn, 'B', 'Class name', 0), (@qn, 'C', 'ID', 1), (@qn, 'D', 'Attribute', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q13, 'Which HTML5 element is used for navigation links?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '<div>', 0), (@qn, 'B', '<nav>', 1), (@qn, 'C', '<header>', 0), (@qn, 'D', '<section>', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q13, 'The fetch() API in JavaScript returns a?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Callback function', 0), (@qn, 'B', 'Synchronous response', 0), (@qn, 'C', 'Promise', 1), (@qn, 'D', 'XML document', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q13, 'CSS Grid uses which property to define column layout?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'grid-template-columns', 1), (@qn, 'B', 'flex-direction', 0), (@qn, 'C', 'column-count', 0), (@qn, 'D', 'display: columns', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 14: Digital Electronics Lab
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Digital Electronics Lab — Logic Gates & Circuits', 'Practical questions on logic gates, flip-flops, multiplexers, counters, and circuit design.', 'Electronics', 'Lab Quiz', 480, 3, 5, 'published', 1);
SET @q14 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q14, 'The output of an XOR gate with inputs A=1, B=1 is?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '1', 0), (@qn, 'B', '0', 1), (@qn, 'C', 'Undefined', 0), (@qn, 'D', 'High Impedance', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q14, 'A JK flip-flop with J=1 and K=1 performs?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Set', 0), (@qn, 'B', 'Reset', 0), (@qn, 'C', 'Toggle', 1), (@qn, 'D', 'No change', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q14, 'How many select lines does an 8:1 multiplexer need?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '2', 0), (@qn, 'B', '3', 1), (@qn, 'C', '4', 0), (@qn, 'D', '8', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q14, 'A 4-bit binary counter can count from 0 to?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', '8', 0), (@qn, 'B', '15', 1), (@qn, 'C', '16', 0), (@qn, 'D', '32', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q14, 'De Morgan''s theorem states that (A·B)'' equals?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'A'' + B''', 1), (@qn, 'B', 'A'' · B''', 0), (@qn, 'C', 'A + B', 0), (@qn, 'D', '(A + B)''', 0);

-- ════════════════════════════════════════════════════════════
-- QUIZ 15: Compiler Design (Lecture)
-- ════════════════════════════════════════════════════════════
INSERT INTO quizzes (title, description, subject, exam_type, duration, passing_marks, total_marks, status, created_by) VALUES
('Compiler Design — Parsing & Code Generation', 'Lexical analysis, syntax parsing, semantic analysis, intermediate code generation, and optimization.', 'Computer Science', 'Lecture Quiz', 600, 3, 5, 'published', 1);
SET @q15 = LAST_INSERT_ID();

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q15, 'The first phase of a compiler is?', 1, 1);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Syntax Analysis', 0), (@qn, 'B', 'Lexical Analysis', 1), (@qn, 'C', 'Semantic Analysis', 0), (@qn, 'D', 'Code Generation', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q15, 'A lexical analyzer converts source code into?', 1, 2);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Parse trees', 0), (@qn, 'B', 'Tokens', 1), (@qn, 'C', 'Assembly code', 0), (@qn, 'D', 'Object code', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q15, 'Which type of parser builds the parse tree from top to bottom?', 1, 3);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Bottom-up parser', 0), (@qn, 'B', 'Top-down parser', 1), (@qn, 'C', 'LR parser', 0), (@qn, 'D', 'Shift-reduce parser', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q15, 'Three-address code is a form of?', 1, 4);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Source code', 0), (@qn, 'B', 'Machine code', 0), (@qn, 'C', 'Intermediate representation', 1), (@qn, 'D', 'Assembly language', 0);

INSERT INTO questions (quiz_id, text, marks, position) VALUES
(@q15, 'Dead code elimination is a type of?', 1, 5);
SET @qn = LAST_INSERT_ID();
INSERT INTO options (question_id, label, text, is_correct) VALUES
(@qn, 'A', 'Lexical optimization', 0), (@qn, 'B', 'Code optimization', 1), (@qn, 'C', 'Syntax error recovery', 0), (@qn, 'D', 'Register allocation', 0);

-- Update total_marks for all new quizzes
UPDATE quizzes SET total_marks = (SELECT COALESCE(SUM(marks), 0) FROM questions WHERE quiz_id = quizzes.id) WHERE id >= @q3;

SELECT CONCAT('✅ Seeded ', COUNT(*), ' new quizzes with questions!') AS result FROM quizzes WHERE id >= @q3;
