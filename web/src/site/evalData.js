// Hand-graded results. c = correct, p = partly correct, w = wrong, r = correctly refused.
export const EVAL_ROWS = [
 {
  "id": "Q01",
  "q": "What is the course code of the Deep Learning lab manual?",
  "expected": "R20A6683.",
  "said": "The course code of the Deep Learning Lab Manual is R20A6683.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q02",
  "q": "Which college publishes this lab manual, and which year, semester and academic year is it for?",
  "expected": "Malla Reddy College of Engineering & Technology; B.Tech IV Year, I Semester, academic year 2024-25.",
  "said": "The lab manual is published by Malla Reddy College of Engineering & Technology. Regarding the year, semester, and academic year: - It is for the IV Year – I Sem (B. Tech). - The academic year given is 2024-25.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q03",
  "q": "How many programs are listed in the lab index?",
  "expected": "16 programs (S.No. 1 to 16, matching Week-1 to Week-16).",
  "said": "Listed 10 programs and warned the count may be incomplete. The real index has 16.",
  "groq": "w",
  "gemini": "w"
 },
 {
  "id": "Q04",
  "q": "What CPU and how much RAM do the lab systems have?",
  "expected": "Intel Core i3-3240 CPU at 3.40 GHz with 4 GB RAM.",
  "said": "The lab system configurations are: - CPU: Intel® CORE™ i3-3240 CPU @ 3.40GHZ - RAM: 4GB",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q05",
  "q": "How are the 15 marks for day-to-day evaluation distributed?",
  "expected": "3 marks each for Regularity, Program written, Execution & Result, Viva-Voce and Dress Code.",
  "said": "The 15 marks for day-to-day evaluation are distributed as follows: * Regularity: 3 Marks * Program written: 3 Marks * Execution & Result: 3 Marks * Viva-Voce: 3 Marks * Dress Code: 3 Marks",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q06",
  "q": "How are the 30 internal lab marks distributed?",
  "expected": "Average of day-to-day evaluation: 15 marks; lab mid exam: 10 marks; viva and observation: 5 marks.",
  "said": "The total 30 marks for lab internal are distributed as follows: * Average of day-to-day evaluation marks: 15 * Lab Mid exam: 10 Marks * VIVA & Observation: 5 Marks",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q07",
  "q": "How are the 70 external lab marks distributed?",
  "expected": "Program written 30, program execution and result 20, viva-voce 10, record 10.",
  "said": "The 70 external lab marks are distributed as follows: - Program Written: 30 Marks - Program Execution and Result: 20 Marks - Viva-Voce: 10 Marks - Record: 10 Marks",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q08",
  "q": "What happens if the lab record is not submitted on time or is not written properly?",
  "expected": "The evaluation marks (5M) will be deducted.",
  "said": "If the record is not submitted in time or is not written properly, the evaluation marks (5M) will be deducted.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q09",
  "q": "How early should students arrive at the lab?",
  "expected": "At least 5 minutes before the starting time; students who come after 5 minutes are not allowed in.",
  "said": "Students are advised to come to the laboratory at least 5 minutes before the starting time.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q10",
  "q": "Which sklearn class does Week-1 (a) use for the single-unit perceptron, and which data file does it read?",
  "expected": "Perceptron() from sklearn.linear_model, reading placement.csv.",
  "said": "Week-1 (a) uses the Perceptron() class from sklearn (imported as from sklearn.linear_model import Perceptron) and reads the data file named /content/gdrive/My Drive/ML_lab/placement.csv.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q11",
  "q": "Which logic functions are classified with the perceptron in Week-1 (b), and which two are left for the exercise?",
  "expected": "OR, AND and XOR data are classified in the program; the exercise asks for NOT and XNOR data.",
  "said": "Found OR, AND and XOR correctly. Mentioned NOT and XNOR but hedged about which are left for the exercise.",
  "groq": "w",
  "gemini": "p"
 },
 {
  "id": "Q12",
  "q": "Which dataset and test split does the Week-2 backpropagation ANN use?",
  "expected": "The Iris dataset with test_size=0.40.",
  "said": "The Week-2 Artificial Neural Network program uses the Iris dataset (iris = datasets.load_iris(), X, y = datasets.load_iris( return_X_y = True)) and a test data split percentage of 40% (test_size=0.40).",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q13",
  "q": "What is the minimum number of hidden layers required in the Week-3 deep feed forward ANN?",
  "expected": "At least 4 hidden layers (>=4).",
  "said": "The Week-3 program requires the number of hidden layers to be $\\ge 4$ (greater than or equal to 4). Therefore, the minimum number of hidden layers required is 4.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q14",
  "q": "What hidden layer sizes and output layer does the Week-4 MNIST deep feed forward network use?",
  "expected": "Three hidden layers with 128, 64 and 32 neurons (ReLU activation), and a 10-unit softmax output layer.",
  "said": "The hidden layers and output layer used are: - Hidden-Layer-1: 128 units (activation='relu', kernel_initializer='HeNormal') - Hidden-Layer-2: 64 units (activation='relu', kernel_initializer='HeNormal') - Hidden-Layer-3: 32…",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q15",
  "q": "How many convolution layers and filters does the Week-5 CNN use, and for how many epochs is it trained?",
  "expected": "Two Conv2D layers with 64 filters each (3x3 kernel), each followed by ReLU and 2x2 max pooling; trained for 10 epochs with batch size 64.",
  "said": "Found the 2 convolution layers and 64 filters, but said the number of epochs was missing (it is 10).",
  "groq": "p",
  "gemini": "p"
 },
 {
  "id": "Q16",
  "q": "What must be recorded when running the Week-6 CNN program on Fashion MNIST?",
  "expected": "The accuracy for the number of epochs, and the time required to run the program on CPU as well as on GPU in Colab.",
  "said": "When running the Week-6 CNN program using the Fashion MNIST datasets, you must record: 1. The accuracy corresponding to the number of epochs. 2. The time required to run the program, using CPU as well as using GPU in Colab.",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q17",
  "q": "Which epoch values are required in the Week-7 exercise on padding and Batch Normalization?",
  "expected": "5, 25 and 225 epochs.",
  "said": "Said the epoch values for this exercise were not specified (they are 5, 25 and 225).",
  "groq": "w",
  "gemini": "w"
 },
 {
  "id": "Q18",
  "q": "Which five architectures are compared in Week-8, and what L1 regularization strength does the program use?",
  "expected": "Base model; model with L1 regularization; model with L2 regularization; model with Dropout; model with both L2 (or L1) and Dropout. The L1 program uses…",
  "said": "The five architectures compared in Week-8 are: a. Base Model b. Model with L1 Regularization c. Model with L2 Regularization d. Model with Dropout e. Model with both L2 (or L1) and Dropout The context tells us that the program…",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q19",
  "q": "Which Keras class does Week-9 use to create new images from a single image, and what shift setting does it use?",
  "expected": "ImageDataGenerator with width_shift_range=[-100,100]; it generates 9 augmented samples.",
  "said": "Week-9 uses the ImageDataGenerator class from Keras to create new images from a single image. It uses the shift setting width_shift_range=[-100,100].",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q20",
  "q": "Which optimizer and learning rate does the Week-10 CIFAR-10 program use?",
  "expected": "RMSprop (tf.keras.optimizers.legacy.RMSprop) with learning rate 0.0005 and decay 1e-6.",
  "said": "The Week-10 CIFAR-10 program uses the RMSprop optimizer with a learning rate (lr) of 0.0005 and a decay of 1e-6 (initiated via tf.keras.optimizers.legacy.RMSprop(lr=0.0005, decay=1e-6)).",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q21",
  "q": "Which activation function and layer sizes does the LeNet-5 program in Week-11 use?",
  "expected": "tanh activation; Conv2D layers with 6, 16 and 120 filters (kernel size 5) with average pooling, then Dense 84 (tanh) and a 10-unit softmax output.",
  "said": "Got tanh and the 6, 16, 120 filters and Dense 84 right, but listed the 120-filter layer twice.",
  "groq": "p",
  "gemini": "p"
 },
 {
  "id": "Q22",
  "q": "What input image size and final layers does the Week-12 VGG16 program use?",
  "expected": "Input size 224x224x3; two Dense(4096, relu) layers followed by Dense(2, softmax) for cat vs dog.",
  "said": "The Week-12 VGG16 program uses: * Input image size: (224, 224) (with a shape of (224, 224, 3)) * Final layers: * Flatten() * Dense(units=4096, activation=\"relu\") * Dense(units=4096, activation=\"relu\") * Dense(units=2,…",
  "groq": "p",
  "gemini": "c"
 },
 {
  "id": "Q23",
  "q": "Which callbacks does the Week-12 VGG16 program use?",
  "expected": "ModelCheckpoint (saving vgg16_1.h5, best model only) and EarlyStopping (patience=20).",
  "said": "The Week-12 VGG16 program uses the following callbacks: 1. ModelCheckpoint 2. EarlyStopping Count: 2 items listed. (The list may be complete based on the provided code: callbacks=[checkpoint,early]).",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q24",
  "q": "What is the size of the noise vector for the Week-15 GAN generator, and what activation does the generator's last layer use?",
  "expected": "The noise vector has size 100; the last layer (Conv2DTranspose) uses tanh and outputs a 28x28x1 image.",
  "said": "The generator takes a vector of size 100 (also noted as noise = tf.random.normal([1, 100])), and the generator's last layer uses the tanh activation function (as shown by activation='tanh' in the upsample to 28x28 code block).",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "Q25",
  "q": "What noise factor is used to create the noisy images in the Week-16 denoising autoencoder?",
  "expected": "factor = 0.39 (Gaussian noise is added to the images, then clipped to the range 0 to 1).",
  "said": "The noise factor used is 0.39 (factor = 0.39).",
  "groq": "c",
  "gemini": "c"
 },
 {
  "id": "U01",
  "q": "What test accuracy did the Week-5 MNIST CNN achieve?",
  "expected": "I don't know.",
  "said": "I don't know the test accuracy achieved by the Week-5 MNIST CNN model, as the context only shows the program setup and layers for Week-5 but does not include the output or accuracy results for it.",
  "groq": "r",
  "gemini": "r"
 },
 {
  "id": "U02",
  "q": "What is the name of the Head of the Department who signs this lab manual?",
  "expected": "I don't know.",
  "said": "The name of the Head of the Department is not mentioned (the context only shows the words \"Head of the Department\" followed by a blank space for a signature). Therefore, this information is missing from the context.",
  "groq": "r",
  "gemini": "r"
 },
 {
  "id": "U03",
  "q": "Which GPU model does Google Colab assign for the Week-6 timing experiment?",
  "expected": "I don't know.",
  "said": "I don't know.",
  "groq": "r",
  "gemini": "r"
 },
 {
  "id": "U04",
  "q": "Which BERT or transformer model does the manual use for sentiment analysis?",
  "expected": "I don't know.",
  "said": "I don't know.",
  "groq": "r",
  "gemini": "r"
 },
 {
  "id": "U05",
  "q": "Who won the 2018 FIFA World Cup?",
  "expected": "I don't know.",
  "said": "I don't know.",
  "groq": "r",
  "gemini": "r"
 }
];
