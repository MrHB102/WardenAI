# train_model.py
import json
import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split

# Carrega os dados
with open('game_data.json') as f:
    data = json.load(f)

# Processa os dados
X = []  # Estados (features)
y = []  # Ações (labels)

# Mapear ações para números
action_mapping = {
    'move forward': 0,
    'turn left': 1,
    'turn right': 2,
    'jump': 3,
    'place block': 4,
    'destroy block': 5,
}

for entry in data:
    state = [
        entry['position']['x'],
        entry['position']['y'],
        entry['position']['z'],
        entry['health'],
        entry['food']
    ]
    action = action_mapping.get(entry['action'], -1)  # -1 se ação não reconhecida

    if action != -1:
        X.append(state)
        y.append(action)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Cria o modelo
model = tf.keras.models.Sequential([
    tf.keras.layers.Dense(128, activation='relu', input_shape=(len(X[0]),)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dense(len(action_mapping), activation='softmax')  # Número de ações
])

model.compile(loss='sparse_categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

# Treina o modelo
model.fit(np.array(X_train), np.array(y_train), epochs=10)

# Salva o modelo treinado
model.save('aimodel.h5')
