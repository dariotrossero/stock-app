from rest_framework import serializers
from .models import Sale, SaleItem
from customers.serializers import CustomerSerializer
from items.serializers import ItemSerializer


class SaleItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = SaleItem
        fields = ['id', 'item', 'item_name',
                  'quantity', 'unit_price', 'subtotal']


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer = CustomerSerializer(read_only=True)

    class Meta:
        model = Sale
        fields = ['id', 'customer', 'total_amount', 'created_at', 'items']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.customer:
            data['customer'] = {
                'id': instance.customer.id,
                'name': instance.customer.name,
                'email': instance.customer.email,
                'phone': instance.customer.phone
            }
        return data
