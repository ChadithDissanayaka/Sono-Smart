import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { QuizService, QuizAnswer, QuizResult } from 'src/app/services/quiz.service';
import { AuthService } from 'src/app/services/auth.service';

interface Question {
  id: number;
  text: string;
  imageUrl: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}

@Component({
  selector: 'app-qa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qa.component.html',
  styleUrls: ['./qa.component.css'],
})
export class QaComponent implements OnInit, OnDestroy {
  constructor(
    private quizService: QuizService,
    private authService: AuthService
  ) {}
  isQuizStarted: boolean = false;
  quizStartTime: Date | null = null;
  quizEndTime: Date | null = null;

  private getRandomImage(organ: string): string {
    const imageNumbers = Array.from({length: 60}, (_, i) => (i + 1).toString().padStart(4, '0'));
    const randomIndex = Math.floor(Math.random() * imageNumbers.length);
    return `/qa/${organ}/${organ}-${imageNumbers[randomIndex]}.png`;
  }

  questions: Question[] = [
    {
      id: 1,
      text: 'Which organ is shown in this ultrasound image?',
      imageUrl: this.getRandomImage('liver'),
      options: ['Kidney', 'Liver', 'Spleen', 'Gallbladder'],
      correctAnswer: 1
    },
    {
      id: 2,
      text: 'Identify the organ in this ultrasound scan:',
      imageUrl: this.getRandomImage('kidney'),
      options: ['Liver', 'Bladder', 'Kidney', 'Bowel'],
      correctAnswer: 2
    },
    {
      id: 3,
      text: 'What organ is being visualized in this image?',
      imageUrl: this.getRandomImage('gallbladder'),
      options: ['Gallbladder', 'Spleen', 'Bladder', 'Liver'],
      correctAnswer: 0
    },
    {
      id: 4,
      text: 'Identify the correct organ shown in this ultrasound:',
      imageUrl: this.getRandomImage('spleen'),
      options: ['Liver', 'Kidney', 'Bowel', 'Spleen'],
      correctAnswer: 3
    },
    {
      id: 5,
      text: 'Which abdominal organ is displayed in this image?',
      imageUrl: this.getRandomImage('bladder'),
      options: ['Bowel', 'Bladder', 'Gallbladder', 'Kidney'],
      correctAnswer: 1
    }
  ];

  currentQuestionIndex: number = 0;
  currentQuestion: Question | null = null;
  showResults: boolean = false;
  correctAnswers: number = 0;
  private timerSubscription?: Subscription;
  remainingTime: string = '15:00';

  ngOnInit(): void {
    this.currentQuestion = this.questions[0];
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  private startTimer(): void {
    const duration = 15 * 60; // 15 minutes in seconds
    this.timerSubscription = interval(1000)
      .pipe(take(duration + 1))
      .subscribe(tick => {
        const remaining = duration - tick;
        const minutes = Math.floor(remaining / 60);
        const seconds = remaining % 60;
        this.remainingTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (remaining === 0) {
          this.calculateResults();
          this.showResults = true;
          this.timerSubscription?.unsubscribe();
        }
      });
  }

  selectAnswer(index: number): void {
    if (this.currentQuestion) {
      this.currentQuestion.selectedAnswer = index;
    }
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex === this.questions.length - 1) {
      this.calculateResults();
      this.showResults = true;
      return;
    }

    this.currentQuestionIndex++;
    this.currentQuestion = this.questions[this.currentQuestionIndex];
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.currentQuestion = this.questions[this.currentQuestionIndex];
    }
  }

  calculateResults(): void {
    this.correctAnswers = this.questions.filter(
      q => q.selectedAnswer === q.correctAnswer
    ).length;

    // Record quiz end time
    this.quizEndTime = new Date();

    // Save quiz results to database if user is logged in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        // Prepare quiz answers data
        const answers: QuizAnswer[] = this.questions.map(q => ({
          questionId: q.id,
          selectedAnswer: q.selectedAnswer !== undefined ? q.selectedAnswer : -1,
          isCorrect: q.selectedAnswer === q.correctAnswer
        }));

        // Calculate time spent (from 15:00 format)
        const timeComponents = this.remainingTime.split(':');
        const minutesRemaining = parseInt(timeComponents[0]);
        const secondsRemaining = parseInt(timeComponents[1]);
        const totalSecondsRemaining = (minutesRemaining * 60) + secondsRemaining;
        const totalSecondsSpent = (15 * 60) - totalSecondsRemaining;
        const minutesSpent = Math.floor(totalSecondsSpent / 60);
        const secondsSpent = totalSecondsSpent % 60;
        const timeSpent = `${minutesSpent}:${secondsSpent.toString().padStart(2, '0')}`;

        // Calculate session duration in seconds
        const sessionDuration = Math.round(
          (this.quizEndTime!.getTime() - this.quizStartTime!.getTime()) / 1000
        );

        // Create quiz result object
        const quizResult: Omit<QuizResult, '_id' | 'user' | 'createdAt'> = {
          correctAnswers: this.correctAnswers,
          totalQuestions: this.questions.length,
          accuracy: (this.correctAnswers / this.questions.length) * 100,
          timeSpent: timeSpent,
          startTime: this.quizStartTime,
          endTime: this.quizEndTime,
          sessionDuration: sessionDuration,
          answers: answers
        };

        // Save quiz result
        this.quizService.saveQuizResult(quizResult).subscribe(result => {
          console.log('Quiz result saved:', result);
        });
      }
    });
  }

  restartQuiz(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    this.questions.forEach(q => {
      q.selectedAnswer = undefined;
    });
    this.currentQuestionIndex = 0;
    this.currentQuestion = this.questions[0];
    this.showResults = false;
    this.correctAnswers = 0;
    this.remainingTime = '15:00';
    this.isQuizStarted = false;
  }

  startQuiz(): void {
    this.isQuizStarted = true;
    this.quizStartTime = new Date();
    this.startTimer();
  }
}
