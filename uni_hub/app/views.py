from django.shortcuts import render
from .models import Students

# Create your views here.
def login(request):
    students = Students.objects.all()

    return render(request, 'students.html', {'students': students})