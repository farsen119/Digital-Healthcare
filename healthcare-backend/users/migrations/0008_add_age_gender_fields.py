# Generated manually for adding age and gender fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_add_is_live_field'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='age',
            field=models.IntegerField(blank=True, help_text='Age in years', null=True),
        ),
        migrations.AddField(
            model_name='customuser',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=10, null=True),
        ),
    ] 