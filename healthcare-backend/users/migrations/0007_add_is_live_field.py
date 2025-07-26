# Generated manually for adding is_live field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_add_doctor_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='is_live',
            field=models.BooleanField(default=False, help_text="Doctor's online/offline status"),
        ),
    ] 