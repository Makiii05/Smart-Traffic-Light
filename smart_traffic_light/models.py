from django.db import models


class IntersectionTypeName(models.TextChoices):
    CROSS_INTERSECTION = "cross_intersection", "Cross Intersection"
    T_INTERSECTION = "t_intersection", "T Intersection"
    Y_INTERSECTION = "y_intersection", "Y Intersection"
    X_INTERSECTION = "x_intersection", "X Intersection"


class RoadTypeName(models.TextChoices):
    ONE_WAY = "one_way", "One Way"
    TWO_WAY = "two_way", "Two Way"
    MIXED = "mixed", "Mixed"


class RoadModeName(models.TextChoices):
    ONE_WAY = "one_way", "One Way"
    TWO_WAY = "two_way", "Two Way"


class VerticalDirectionName(models.TextChoices):
    NORTH_TO_SOUTH = "north_to_south", "North to South"
    SOUTH_TO_NORTH = "south_to_north", "South to North"
    AUTO = "auto", "Auto"


class HorizontalDirectionName(models.TextChoices):
    EAST_TO_WEST = "east_to_west", "East to West"
    WEST_TO_EAST = "west_to_east", "West to East"
    AUTO = "auto", "Auto"


class Admin(models.Model):
    username = models.CharField(max_length=100, unique=True)
    email = models.EmailField(max_length=150, unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "admins"

    def __str__(self):
        return self.username


class Intersection(models.Model):
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE, related_name="intersections")
    name = models.CharField(max_length=150)
    intersection_type = models.CharField(
        max_length=30,
        choices=IntersectionTypeName.choices
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "intersections"

    def __str__(self):
        return self.name


class RoadType(models.Model):
    intersection = models.OneToOneField(
        Intersection,
        on_delete=models.CASCADE,
        related_name="road_type_config"
    )
    road_type = models.CharField(
        max_length=20,
        choices=RoadTypeName.choices
    )
    vertical_road_mode = models.CharField(
        max_length=20,
        choices=RoadModeName.choices,
        null=True,
        blank=True
    )
    horizontal_road_mode = models.CharField(
        max_length=20,
        choices=RoadModeName.choices,
        null=True,
        blank=True
    )
    vertical_direction = models.CharField(
        max_length=20,
        choices=VerticalDirectionName.choices,
        default=VerticalDirectionName.AUTO
    )
    horizontal_direction = models.CharField(
        max_length=20,
        choices=HorizontalDirectionName.choices,
        default=HorizontalDirectionName.AUTO
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "road_types"

    def __str__(self):
        return f"{self.intersection.name} Road Type"


class Pedestrian(models.Model):
    intersection = models.OneToOneField(
        Intersection,
        on_delete=models.CASCADE,
        related_name="pedestrian_config"
    )
    north = models.BooleanField(default=False)
    south = models.BooleanField(default=False)
    east = models.BooleanField(default=False)
    west = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pedestrians"

    def __str__(self):
        return f"{self.intersection.name} Pedestrian Setup"


class SystemLog(models.Model):
    admin = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="system_logs"
    )
    intersection = models.ForeignKey(
        Intersection,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="system_logs"
    )
    action = models.CharField(max_length=50)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "system_logs"

    def __str__(self):
        return f"{self.action} at {self.created_at}"

