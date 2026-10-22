from rest_framework.pagination import PageNumberPagination

class GeneralPagination(PageNumberPagination):
    page_size=10
    page_size_query_param='page_size'
    max_page_size=100

class CreatedResumePagination(PageNumberPagination):
    page_size=5
    page_size_query_param='page_size'
    max_page_size=15